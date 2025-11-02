/**
 * API Response Types and Utilities
 * Centralized type definitions and helper functions for API responses
 */

export interface ApiSuccessResponse<T = any> {
  data: T;
  message?: string;
  success: true;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: any;
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
  details?: any
): ApiErrorResponse {
  return {
    error,
    message,
    details,
    success: false,
  };
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
