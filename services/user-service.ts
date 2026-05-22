import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import { User, parseUser, partialUserToJson } from '@/types/user/user';
import { UserFiles } from '@/types/user/user-files';
import { Employee, parseEmployee } from '@/types/employee';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = any;

function safeParseUser(data: ApiResponse): User {
  try {
    return parseUser(data);
  } catch (error) {
    logger.error('Failed to parse user data:', error);
    throw new ApiError('Failed to process user data. Please try again.', 422);
  }
}

function safeParseEmployees(data: ApiResponse[]): Employee[] {
  if (!Array.isArray(data)) {
    return [];
  }
  try {
    return data.map((item) => parseEmployee(item));
  } catch (error) {
    logger.error('Failed to parse employees data:', error);
    throw new ApiError(
      'Failed to process employees data. Please try again.',
      422
    );
  }
}

/**
 * userService
 *
 * Thin wrapper around the backend user REST endpoints. Provides
 * typed, parse-safe convenience methods for user profile operations.
 *
 * Implementation notes:
 * - This module expects the backend to return JSON payloads compatible
 *   with `parseUser` and `userToJson` helpers.
 * - Network errors and non-2xx responses are propagated from the API
 *   client and should be handled by callers (e.g. via React Query
 *   mutation error handlers).
 * - Parsing errors are wrapped in ApiError for consistent error handling.
 * - File uploads use multipart/form-data with 'data' and 'attachments' fields.
 */
export const userService = {
  /**
   * Fetch the current authenticated user's profile.
   *
   * @returns {Promise<User>} Resolves with the parsed user profile.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async getCurrentUser(): Promise<User> {
    const data = await api.get<ApiResponse>('/user/web');
    return safeParseUser(data);
  },

  /**
   * Update the current authenticated user's profile (JSON only, no files).
   *
   * @param {number} id - User ID to update.
   * @param {Partial<User>} userData - User data to update.
   * @returns {Promise<User>} The updated, parsed user profile.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async updateCurrentUser(id: number, userData: Partial<User>): Promise<User> {
    const payload = partialUserToJson(userData);
    const data = await api.patch<ApiResponse>(`/user/web/${id}`, payload);
    return safeParseUser(data);
  },

  /**
   * Update the current authenticated user's profile with file uploads.
   * Uses multipart/form-data to send both JSON data and files.
   *
   * Backend expects:
   * - 'data' field: JSON string of user data
   * - 'profilePicture' field: Profile picture file
   * - 'cv' field: CV/resume file
   *
   * @param {number} id - User ID to update.
   * @param {Partial<User>} userData - User data to update.
   * @param {UserFiles} files - Files to upload (profilePicture, cv).
   * @returns {Promise<User>} The updated, parsed user profile.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async updateCurrentUserWithFiles(
    id: number,
    userData: Partial<User>,
    files: UserFiles
  ): Promise<User> {
    const payload = partialUserToJson(userData);

    // Build files map with correct field names expected by backend
    const fileMap: Record<string, File[]> = {};
    if (files.profilePicture) {
      fileMap['profilePicture'] = [files.profilePicture];
    }
    if (files.cv) {
      fileMap['cv'] = [files.cv];
    }

    const data = await api.patchMultipart<ApiResponse>(
      `/user/web/${id}`,
      payload,
      Object.keys(fileMap).length > 0 ? fileMap : undefined
    );
    return safeParseUser(data);
  },

  /**
   * Update the user's selected organization preference.
   * This is a silent update used for syncing organization context across devices.
   *
   * @param {number} id - User ID to update.
   * @param {number | null} organizationId - Organization ID to set as default (null to clear).
   * @returns {Promise<User>} The updated, parsed user profile.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async updateUserOrganization(
    id: number,
    organizationId: number | null
  ): Promise<User> {
    const payload = { defaultOrganizationId: organizationId };
    const data = await api.patchMultipart<ApiResponse>(
      `/user/web/${id}`,
      payload
    );
    return safeParseUser(data);
  },

  /**
   * Get all employee profiles for the current user.
   * Returns a list of employee objects across all organizations the user belongs to.
   * The current/active employee is where defaultOrganizationId = employee.organizationId.
   *
   * @returns {Promise<Employee[]>} List of employee profiles for the current user.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async getUserEmployees(): Promise<Employee[]> {
    const data = await api.get<ApiResponse[]>('/user/web/employees');
    return safeParseEmployees(data);
  },
};

export { type UserFiles } from '@/types/user/user-files';
