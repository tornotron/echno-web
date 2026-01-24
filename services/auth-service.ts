import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  RegistrationRequest,
  RegistrationResponse,
} from '@/types/auth/registration';

/**
 * authService
 *
 * Handles authentication-related API calls such as user registration.
 * Login/logout are handled by NextAuth directly with Keycloak.
 *
 * Error handling:
 * - Network errors are wrapped in ApiError with status 0
 * - Validation errors (422) include field-level error details
 * - Conflict errors (409) indicate email/username already exists
 */
export const authService = {
  /**
   * Register a new user.
   *
   * @param data - Registration request payload
   * @returns Promise resolving to the registration response
   * @throws {ApiError} on network, validation, or server errors
   */
  async register(data: RegistrationRequest): Promise<RegistrationResponse> {
    try {
      return await api.post<RegistrationResponse>('/auth/register', data);
    } catch (error) {
      // Log for debugging but re-throw for caller to handle
      logger.error('Registration failed:', error);

      // Enhance error message for common registration issues
      if (error instanceof ApiError) {
        if (error.status === 409) {
          throw new ApiError(
            'An account with this email or username already exists.',
            409,
            error.errors
          );
        }
        if (error.status === 422 && error.errors) {
          throw new ApiError(
            'Please check your registration details.',
            422,
            error.errors
          );
        }
      }

      throw error;
    }
  },
};
