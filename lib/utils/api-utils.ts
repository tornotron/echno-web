/**
 * API Response Types and Utilities
 * Centralized type definitions and helper functions for API responses
 */

export interface ApiSuccessResponse<T = any> {
  data: T;
  message?: string;
  success: true;
}

/**
 * Comprehensive error response structure for API errors
 * Used across all API endpoints for consistent error handling
 */
export interface ApiErrorResponse {
  /** Error category/type (e.g., 'Unauthorized', 'Validation Error') */
  error: string;
  /** Technical error message for logging/debugging */
  message: string;
  /** User-friendly error message for display in UI */
  userMessage?: string;
  /** Additional error details or context */
  details?: any;
  /** HTTP status code */
  statusCode?: number;
  /** Error timestamp */
  timestamp?: string;
  /** Request path that caused the error */
  path?: string;
  /** Validation errors (for 400/422 responses) */
  validationErrors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
  success: false;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: any): response is ApiErrorResponse {
  return response && response.success === false && 'error' in response;
}

/**
 * Type guard to check if response is successful
 */
export function isApiSuccess<T>(response: any): response is ApiSuccessResponse<T> {
  return response && response.success === true && 'data' in response;
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(data: T, message?: string): ApiSuccessResponse<T> {
  return {
    data,
    message,
    success: true,
  };
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  message: string,
  options?: {
    userMessage?: string;
    details?: any;
    statusCode?: number;
    path?: string;
    validationErrors?: Array<{ field: string; message: string; value?: any }>;
  }
): ApiErrorResponse {
  return {
    error,
    message,
    userMessage: options?.userMessage,
    details: options?.details,
    statusCode: options?.statusCode,
    timestamp: new Date().toISOString(),
    path: options?.path,
    validationErrors: options?.validationErrors,
    success: false,
  };
}

/**
 * Extracts user-friendly error message from API error response
 * Prioritizes userMessage, falls back to message, then generic message
 */
export function getUserFriendlyMessage(error: ApiErrorResponse | unknown): string {
  if (error && typeof error === 'object' && 'userMessage' in error) {
    const apiError = error as ApiErrorResponse;
    return apiError.userMessage || apiError.message || 'An unexpected error occurred';
  }
  
  return extractErrorMessage(error);
}

/**
 * Parses error response from fetch and returns ApiErrorResponse
 */
export async function parseErrorResponse(response: Response): Promise<ApiErrorResponse> {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const errorData = await response.json();
      // If it's already an ApiErrorResponse, return it
      if (errorData.error && errorData.message) {
        return {
          ...errorData,
          statusCode: errorData.statusCode || response.status,
          success: false,
        };
      }
      // Otherwise, construct one
      return createErrorResponse(
        'API Error',
        errorData.message || JSON.stringify(errorData),
        {
          userMessage: errorData.userMessage,
          details: errorData,
          statusCode: response.status,
        }
      );
    }
    
    // Handle text responses
    const text = await response.text();
    return createErrorResponse(
      'API Error',
      text || `HTTP ${response.status}`,
      {
        userMessage: getDefaultErrorMessage(response.status),
        statusCode: response.status,
      }
    );
  } catch (parseError) {
    return createErrorResponse(
      'Parse Error',
      'Failed to parse error response',
      {
        userMessage: getDefaultErrorMessage(response.status),
        details: parseError,
        statusCode: response.status,
      }
    );
  }
}

/**
 * Gets default user-friendly message for HTTP status codes
 */
export function getDefaultErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'Conflict detected. The resource may have been modified.';
    case 422:
      return 'Invalid data provided. Please check all fields and try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error occurred. Please try again later.';
    case 502:
    case 503:
      return 'Service is temporarily unavailable. Please try again in a few moments.';
    case 504:
      return 'Request timeout. Please check your connection and try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Extracts error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unexpected error occurred';
}

/**
 * Safe JSON parse with fallback
 */
export async function safeJsonParse<T = any>(
  response: Response,
  fallback: T
): Promise<T> {
  try {
    return await response.json();
  } catch {
    return fallback;
  }
}

/**
 * Handles API errors and converts them to user-friendly messages
 */
export function handleApiError(error: unknown): string {
  const message = extractErrorMessage(error);
  
  // Map common error messages to user-friendly versions
  const errorMap: Record<string, string> = {
    'Failed to fetch': 'Unable to connect to the server. Please check your internet connection.',
    'Network request failed': 'Network error. Please try again.',
    'Unauthorized': 'Your session has expired. Please login again.',
    '401': 'Authentication required. Please login.',
    '403': 'You do not have permission to access this resource.',
    '404': 'The requested resource was not found.',
    '500': 'Server error. Please try again later.',
  };
  
  // Check if any mapped error matches
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return message;
}

/**
 * Retry fetch with exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      // If successful or client error (4xx), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      // For server errors (5xx), retry
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    
    // Wait before retrying (exponential backoff)
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, i)));
    }
  }
  
  throw lastError || new Error('Fetch failed after retries');
}
