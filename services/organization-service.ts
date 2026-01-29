import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  Organization,
  organizationToJsonWithIds,
  parseOrganization,
} from '@/types/organization/organization';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = any;

/**
 * Safely parse organization data with error handling.
 * @throws {ApiError} when parsing fails
 */
function safeParseOrganization(data: ApiResponse): Organization {
  try {
    return parseOrganization(data);
  } catch (error) {
    logger.error('Failed to parse organization data:', error);
    throw new ApiError(
      'Failed to process organization data. Please try again.',
      422
    );
  }
}

/**
 * Safely parse organization array with error handling.
 * @throws {ApiError} when parsing fails
 */
function safeParseOrganizations(data: ApiResponse[]): Organization[] {
  if (!Array.isArray(data)) {
    return [];
  }
  try {
    return data.map((item) => parseOrganization(item));
  } catch (error) {
    logger.error('Failed to parse organizations data:', error);
    throw new ApiError(
      'Failed to process organizations data. Please try again.',
      422
    );
  }
}

/**
 * Files that can be uploaded for an organization.
 */
export interface OrganizationFiles {
  organizationLogo?: File;
}

/**
 * organizationService
 *
 * Thin wrapper around the backend organization REST endpoints. Provides
 * typed, parse-safe convenience methods for common organization CRUD
 * operations used throughout the application.
 *
 * Implementation notes:
 * - This module expects the backend to return JSON payloads compatible
 *   with `parseOrganization` and `organizationToJsonWithIds` helpers.
 * - Network errors and non-2xx responses are propagated from the API
 *   client and should be handled by callers (e.g. via React Query
 *   mutation error handlers).
 * - Parsing errors are wrapped in ApiError for consistent error handling.
 * - File uploads use multipart/form-data with 'data' and 'attachments' fields.
 */
export const organizationService = {
  /**
   * Fetch all organizations.
   *
   * @returns {Promise<Organization[]>} Resolves with an array of parsed organizations.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async getAll(): Promise<Organization[]> {
    const data = await api.get<ApiResponse[]>('/organization/web');
    return safeParseOrganizations(data);
  },

  /**
   * Fetch organizations created by a specific user.
   *
   * @param {number} creatorId - The numeric id of the creator user.
   * @returns {Promise<Organization[]>} Resolves with an array of parsed organizations.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async getByCreator(creatorId: number): Promise<Organization[]> {
    const data = await api.get<ApiResponse[]>(
      `/organization/web/creator/${creatorId}`
    );
    return safeParseOrganizations(data);
  },

  /**
   * Fetch a single organization by id.
   *
   * @param {number} id - Organization id.
   * @returns {Promise<Organization>} Parsed organization object.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async getById(id: number): Promise<Organization> {
    const data = await api.get<ApiResponse>(`/organization/web/${id}`);
    return safeParseOrganization(data);
  },

  /**
   * Update an existing organization.
   *
   * @param {number} id - Organization id to update.
   * @param {Organization} org - Organization data to persist.
   * @returns {Promise<Organization>} The updated, parsed organization.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async update(id: number, org: Organization): Promise<Organization> {
    const payload = organizationToJsonWithIds(org);
    const data = await api.patch<ApiResponse>(
      `/organization/web/${id}`,
      payload
    );
    return safeParseOrganization(data);
  },

  /**
   * Create a new organization.
   * Uses multipart/form-data as required by the backend endpoint.
   *
   * @param {Organization} org - Organization data to create.
   * @returns {Promise<Organization>} The created, parsed organization.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async create(org: Organization): Promise<Organization> {
    const payload = organizationToJsonWithIds(org);
    const data = await api.postMultipart<ApiResponse>(
      '/organization/web',
      payload
    );
    return safeParseOrganization(data);
  },

  /**
   * Delete an organization by id.
   *
   * @param {number} id - Organization id to delete.
   * @returns {Promise<void>} Resolves when delete completes.
   * @throws {ApiError} on network or server errors
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/organization/web/${id}`);
  },

  /**
   * Create a new organization with file uploads.
   * Uses multipart/form-data to send both JSON data and files.
   *
   * Backend expects:
   * - 'data' field: JSON string of organization data
   * - 'attachments' field(s): File objects (logo)
   *
   * @param {Organization} org - Organization data to create.
   * @param {OrganizationFiles} files - Files to upload (logo).
   * @returns {Promise<Organization>} The created, parsed organization.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async createWithFiles(
    org: Organization,
    files: OrganizationFiles
  ): Promise<Organization> {
    const payload = organizationToJsonWithIds(org);

    // Collect files into attachments array
    const attachments: File[] = [];
    if (files.organizationLogo) {
      attachments.push(files.organizationLogo);
    }

    const data = await api.postMultipart<ApiResponse>(
      '/organization/web',
      payload,
      attachments.length > 0 ? { attachments } : undefined
    );
    return safeParseOrganization(data);
  },

  /**
   * Update an existing organization with file uploads.
   * Uses multipart/form-data to send both JSON data and files.
   *
   * Backend expects:
   * - 'data' field: JSON string of organization data
   * - 'attachments' field(s): File objects (logo)
   *
   * @param {number} id - Organization id to update.
   * @param {Organization} org - Organization data to persist.
   * @param {OrganizationFiles} files - Files to upload (logo).
   * @returns {Promise<Organization>} The updated, parsed organization.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async updateWithFiles(
    id: number,
    org: Organization,
    files: OrganizationFiles
  ): Promise<Organization> {
    const payload = organizationToJsonWithIds(org);

    // Collect files into attachments array
    const attachments: File[] = [];
    if (files.organizationLogo) {
      attachments.push(files.organizationLogo);
    }

    const data = await api.patchMultipart<ApiResponse>(
      `/organization/web/${id}`,
      payload,
      attachments.length > 0 ? { attachments } : undefined
    );
    return safeParseOrganization(data);
  },
};
