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
  errors?: Record<string, string[]>;
}

/**
 * Custom error class for API errors with status code information.
 */
export class ApiError extends Error {
  status: number;
  isAuthError: boolean;
  isNotFound: boolean;
  isServerError: boolean;
  isTimeout: boolean;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
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
const DEFAULT_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Errors that should trigger a retry
const RETRYABLE_ERRORS = new Set(['TypeError', 'AbortError']);

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
   * Fetch wrapper that retries on transient network errors using exponential backoff.
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

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.fetchWithTimeout(url, options, timeout);
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
   */
  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const response = await this.fetchWithRetry(
      `${this.baseURL}${endpoint}`,
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
   */
  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const response = await this.fetchWithRetry(
      `${this.baseURL}${endpoint}`,
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
   */
  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const response = await this.fetchWithRetry(
      `${this.baseURL}${endpoint}`,
      {
        method: 'PATCH',
        headers: this.headers,
        body: data ? JSON.stringify(data) : undefined,
      },
      options
    );

    return this.handleResponse<T>(response);
  }

  /**
   * Issue a DELETE request.
   */
  async delete<T = unknown>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<T> {
    const response = await this.fetchWithRetry(
      `${this.baseURL}${endpoint}`,
      { method: 'DELETE', headers: this.headers },
      options
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
};
