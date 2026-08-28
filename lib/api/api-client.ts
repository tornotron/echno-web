/**
 * HTTP API client utilities
 *
 * This module exposes a lightweight `ApiClient` wrapper around the
 * browser `fetch` API with sensible defaults for enterprise applications:
 * - request timeout with AbortController
 * - automatic retry for transient network errors (exponential backoff)
 * - centralized response handling and typed JSON parsing
 *
 * The `api` exported object provides bound convenience functions for
 * the most common HTTP verbs used across the codebase.
 */
import { SESSION_TOKEN_EXPIRED_ERROR } from '@/lib/auth/constants';
import { refreshSessionOnce } from '@/lib/auth/refresh-session-once';

export interface ApiResponse<T = unknown> {
  /** The payload returned by the backend */
  data: T;
  /** Optional human-readable message from the backend */
  message?: string;
  /** Operation success flag (optional depending on backend contract) */
  success: boolean;
}

/**
 * Standardized error payload returned by backend on failure.
 */
export interface ApiErrorData {
  message: string;
  status: number;
  details?: string;
  errors?: Record<string, string[]>;
}

/**
 * Custom error class for API errors with status code information.
 */
export class ApiError extends Error {
  status: number;
  details?: string;
  isAuthError: boolean;
  isNotFound: boolean;
  isServerError: boolean;
  isTimeout: boolean;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    details?: string,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.errors = errors;
    this.isAuthError = status === 401 || status === 403;
    this.isNotFound = status === 404;
    this.isServerError = status >= 500;
    this.isTimeout = false;
  }

  static timeout(message = 'Request timeout'): ApiError {
    const error = new ApiError(message, 504);
    error.isTimeout = true;
    return error;
  }

  static network(message = 'Network error'): ApiError {
    return new ApiError(message, 0);
  }
}

/** Optional per-request settings. */
interface RequestOptions {
  timeout?: number;
  retries?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds
const UPLOAD_TIMEOUT_MS = 120_000; // 2 minutes for file uploads
const DEFAULT_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Errors that should trigger a retry
const RETRYABLE_ERRORS = new Set(['TypeError', 'AbortError']);

/**
 * Detects the BFF proxy's "the access token in your cookie has expired" signal.
 *
 * The response is cloned before the body is read, because a body can only be
 * consumed once and the caller still needs an intact response when the signal
 * turns out to be absent.
 *
 * @param response - Response returned by the BFF proxy.
 * @returns True only for a 401 whose JSON body carries the expiry error code.
 */
async function isSessionTokenExpiredResponse(
  response: Response
): Promise<boolean> {
  if (response.status !== 401) {
    return false;
  }

  try {
    const body = (await response.clone().json()) as { error?: string } | null;
    return body?.error === SESSION_TOKEN_EXPIRED_ERROR;
  } catch {
    // Not JSON, so not our signal.
    return false;
  }
}

/**
 * ApiClient
 *
 * Encapsulates common HTTP behavior used by the frontend to communicate
 * with backend services. Methods return parsed JSON typed as `T` and
 * will throw an `Error` on network problems or non-2xx responses.
 */
class ApiClient {
  private baseURL: string;
  private headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  /**
   * Create a new ApiClient
   * @param baseURL - Base URL to prefix endpoints with. Defaults to `NEXT_PUBLIC_API_URL` or `/api`.
   */
  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || '/api') {
    this.baseURL = baseURL;
  }

  /**
   * Set or update a default header sent with every request.
   * Call this after session is established (e.g. to set X-Organization-Id).
   */
  setDefaultHeader(key: string, value: string): void {
    (this.headers as Record<string, string>)[key] = value;
  }

  /**
   * Handle fetch `Response` objects. Throws on non-ok responses and
   * returns parsed JSON otherwise.
   *
   * @throws {ApiError} when response.ok === false
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData: ApiErrorData = await response.json().catch(() => ({
        message: this.getDefaultErrorMessage(response.status),
        status: response.status,
      }));

      throw new ApiError(
        errorData.message || this.getDefaultErrorMessage(response.status),
        response.status,
        errorData.details,
        errorData.errors
      );
    }

    return response.json();
  }

  /**
   * Get user-friendly error message based on HTTP status code.
   */
  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case 400: {
        return 'Invalid request. Please check your input.';
      }
      case 401: {
        return 'Please sign in to continue.';
      }
      case 403: {
        return 'You do not have permission to perform this action.';
      }
      case 404: {
        return 'The requested resource was not found.';
      }
      case 408: {
        return 'Request timeout. Please try again.';
      }
      case 409: {
        return 'This action conflicts with existing data.';
      }
      case 422: {
        return 'Invalid data provided.';
      }
      case 429: {
        return 'Too many requests. Please wait and try again.';
      }
      case 500: {
        return 'Server error. Please try again later.';
      }
      case 502: {
        return 'Service temporarily unavailable.';
      }
      case 503: {
        return 'Service is currently unavailable.';
      }
      case 504: {
        return 'Request timeout. Please try again.';
      }
      default: {
        return `An error occurred (${status})`;
      }
    }
  }

  /**
   * Perform `fetch` with an AbortController-enforced timeout.
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch wrapper that retries on transient network errors using exponential
   * backoff, and recovers once from an expired access token.
   *
   * Every request method funnels through here, which makes it the one place to
   * answer the BFF's expiry signal: {@link refreshSessionOnce} forces the
   * session round trip that refreshes the cookie, then the original request is
   * replayed. The replay is capped at one per request, so a session that cannot
   * be refreshed surfaces its 401 to the caller instead of looping, and the
   * refresh itself is shared across every request that hit the signal together.
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    {
      timeout = DEFAULT_TIMEOUT_MS,
      retries = DEFAULT_RETRIES,
    }: RequestOptions = {}
  ): Promise<Response> {
    let lastError: Error | null = null;
    let hasRefreshedSession = false;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, options, timeout);

        if (
          !hasRefreshedSession &&
          (await isSessionTokenExpiredResponse(response))
        ) {
          hasRefreshedSession = true;
          await refreshSessionOnce();
          return await this.fetchWithTimeout(url, options, timeout);
        }

        return response;
      } catch (error) {
        // Handle timeout (AbortError)
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = ApiError.timeout();
          // Don't retry timeouts
          throw lastError;
        }

        lastError = error instanceof Error ? error : new Error(String(error));

        // Only retry on network errors
        const isRetryable =
          RETRYABLE_ERRORS.has(lastError.name) ||
          lastError.message.includes('network') ||
          lastError.message.includes('fetch');

        if (!isRetryable || attempt === retries) {
          // Wrap in ApiError if not already
          if (!(lastError instanceof ApiError)) {
            lastError = ApiError.network(lastError.message);
          }
          throw lastError;
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt))
        );
      }
    }

    throw lastError;
  }

  /**
   * Issue a GET request.
   * @param endpoint - Path relative to baseURL (must begin with '/').
   * @param params - Optional query parameters.
   */
  async get<T = unknown>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    options?: RequestOptions
  ): Promise<T> {
    const url = new URL(
      `${this.baseURL}${endpoint}`,
      globalThis.location.origin
    );

    if (params) {
      for (const key of Object.keys(params)) {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      }
    }

    const response = await this.fetchWithRetry(
      url.toString(),
      { method: 'GET', headers: this.headers },
      options
    );

    return this.handleResponse<T>(response);
  }

  /**
   * Issue a POST request with JSON body.
   * @param endpoint - Path relative to baseURL
   * @param data - Request body data
   * @param params - Optional query parameters
   * @param options - Optional request options
   */
  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    params?: Record<string, string | number | boolean>,
    options?: RequestOptions
  ): Promise<T> {
    const url = new URL(
      `${this.baseURL}${endpoint}`,
      globalThis.location.origin
    );

    if (params) {
      for (const key of Object.keys(params)) {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      }
    }

    const response = await this.fetchWithRetry(
      url.toString(),
      {
        method: 'POST',
        headers: this.headers,
        body: data ? JSON.stringify(data) : undefined,
      },
      options
    );

    return this.handleResponse<T>(response);
  }

  /**
   * Issue a PUT request with JSON body.
   * @param endpoint - Path relative to baseURL
   * @param data - Request body data
   * @param params - Optional query parameters
   * @param options - Optional request options
   */
  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    params?: Record<string, string | number | boolean>,
    options?: RequestOptions
  ): Promise<T> {
    const url = new URL(
      `${this.baseURL}${endpoint}`,
      globalThis.location.origin
    );

    if (params) {
      for (const key of Object.keys(params)) {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      }
    }

    const response = await this.fetchWithRetry(
      url.toString(),
      {
        method: 'PUT',
        headers: this.headers,
        body: data ? JSON.stringify(data) : undefined,
      },
      options
    );

    return this.handleResponse<T>(response);
  }

  /**
   * Issue a PATCH request with JSON body.
   * @param endpoint - Path relative to baseURL
   * @param data - Request body data
   * @param params - Optional query parameters
   * @param options - Optional request options
   */
  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    params?: Record<string, string | number | boolean>,
    options?: RequestOptions
  ): Promise<T> {
    const url = new URL(
      `${this.baseURL}${endpoint}`,
      globalThis.location.origin
    );

    if (params) {
      for (const key of Object.keys(params)) {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      }
    }

    // Custom JSON stringification for PATCH to handle Java backend type expectations
    let body: string | undefined;
    if (data) {
      body = JSON.stringify(data);
      // Fix: Ensure salary values are formatted as floats (with decimal) for Java backend
      // Java's Jackson parser treats "45000" as Integer but "45000.0" as Double
      body = body.replaceAll(/"salary":(\d+)([,}])/g, '"salary":$1.0$2');
    }

    const response = await this.fetchWithRetry(
      url.toString(),
      {
        method: 'PATCH',
        headers: this.headers,
        body,
      },
      options
    );

    return this.handleResponse<T>(response);
  }

  /**
   * Issue a DELETE request.
   * @param endpoint - Path relative to baseURL
   * @param params - Optional query parameters
   * @param options - Optional request options
   */
  async delete<T = unknown>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    options?: RequestOptions
  ): Promise<T> {
    const url = new URL(
      `${this.baseURL}${endpoint}`,
      globalThis.location.origin
    );

    if (params) {
      for (const key of Object.keys(params)) {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      }
    }

    const response = await this.fetchWithRetry(
      url.toString(),
      { method: 'DELETE', headers: this.headers },
      options
    );

    return this.handleResponse<T>(response);
  }

  /**
   * Issue a POST request with multipart/form-data.
   * Used for file uploads where the backend expects:
   * - 'data' field: JSON string of the entity data
   * - 'attachments' field(s): File objects
   *
   * @param endpoint - Path relative to baseURL
   * @param data - JSON data to send (will be stringified and sent as 'data' field)
   * @param files - Map of field names to File arrays (e.g., { attachments: [file1, file2] })
   */
  async postMultipart<T = unknown>(
    endpoint: string,
    data: unknown,
    files?: Record<string, File[]>,
    options?: RequestOptions
  ): Promise<T> {
    const formData = new FormData();

    // Add JSON data as 'data' field
    formData.append('data', JSON.stringify(data));

    // Add files
    if (files) {
      for (const [fieldName, fileList] of Object.entries(files)) {
        for (const file of fileList) {
          formData.append(fieldName, file);
        }
      }
    }

    // Don't set Content-Type header - browser will set it with boundary
    const response = await this.fetchWithRetry(
      `${this.baseURL}${endpoint}`,
      {
        method: 'POST',
        body: formData,
        // Note: Don't include Content-Type header for multipart
      },
      { timeout: UPLOAD_TIMEOUT_MS, retries: 0, ...options }
    );

    return this.handleResponse<T>(response);
  }

  /**
   * Issue a PATCH request with multipart/form-data.
   * Used for file uploads where the backend expects:
   * - 'data' field: JSON string of the entity data
   * - 'attachments' field(s): File objects
   *
   * @param endpoint - Path relative to baseURL
   * @param data - JSON data to send (will be stringified and sent as 'data' field)
   * @param files - Map of field names to File arrays (e.g., { attachments: [file1, file2] })
   */
  async patchMultipart<T = unknown>(
    endpoint: string,
    data: unknown,
    files?: Record<string, File[]>,
    options?: RequestOptions
  ): Promise<T> {
    const formData = new FormData();

    // Add JSON data as 'data' field
    formData.append('data', JSON.stringify(data));

    // Add files
    if (files) {
      for (const [fieldName, fileList] of Object.entries(files)) {
        for (const file of fileList) {
          formData.append(fieldName, file);
        }
      }
    }

    // Don't set Content-Type header - browser will set it with boundary
    const response = await this.fetchWithRetry(
      `${this.baseURL}${endpoint}`,
      {
        method: 'PATCH',
        body: formData,
        // Note: Don't include Content-Type header for multipart
      },
      { timeout: UPLOAD_TIMEOUT_MS, retries: 0, ...options }
    );

    return this.handleResponse<T>(response);
  }

  /**
   * Issue a POST request with raw FormData.
   * Used for simple file uploads without additional JSON data.
   *
   * @param endpoint - Path relative to baseURL
   * @param formData - FormData object containing files and fields
   */
  async postFormData<T = unknown>(
    endpoint: string,
    formData: FormData,
    options?: RequestOptions
  ): Promise<T> {
    // Don't set Content-Type header - browser will set it with boundary
    const response = await this.fetchWithRetry(
      `${this.baseURL}${endpoint}`,
      {
        method: 'POST',
        body: formData,
        // Note: Don't include Content-Type header for multipart
      },
      { timeout: UPLOAD_TIMEOUT_MS, retries: 0, ...options }
    );

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();

// Export individual methods for convenience
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  postMultipart: apiClient.postMultipart.bind(apiClient),
  patchMultipart: apiClient.patchMultipart.bind(apiClient),
  postFormData: apiClient.postFormData.bind(apiClient),
};
