import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  Organization,
  organizationToJsonWithIds,
  parseOrganization,
  OrganizationFiles,
} from '@/types/organization';

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
 * organizationService
 *
 * Thin wrapper around the backend organization REST endpoints.
 *
 * Endpoints:
 * - GET    /organization/web                  — get all organizations for current user
 * - POST   /organization/web                  — create a new organization
 * - GET    /organization/web/{organizationId}  — get organization by ID
 * - PATCH  /organization/web/{organizationId}  — update organization
 * - DELETE /organization/web/{organizationId}  — delete organization
 */
export const organizationService = {
  /**
   * Fetch all organizations for the current user.
   *
   * @returns {Promise<Organization[]>} Resolves with an array of parsed organizations.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async getAll(): Promise<Organization[]> {
    const data = await api.get<ApiResponse[]>('/organization/web');
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
   * Create a new organization.
   * Uses multipart/form-data to support optional file uploads (e.g. logo).
   *
   * @param {Organization} org - Organization data to create.
   * @param {File} [logoFile] - Optional logo file to upload.
   * @returns {Promise<Organization>} The created, parsed organization.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async create(org: Organization, logoFile?: File): Promise<Organization> {
    const payload = organizationToJsonWithIds(org);
    const files = logoFile ? { attachments: [logoFile] } : undefined;
    const data = await api.postMultipart<ApiResponse>(
      '/organization/web',
      payload,
      files
    );
    return safeParseOrganization(data);
  },

  /**
   * Update an existing organization.
   * Always uses multipart/form-data (backend requirement).
   *
   * @param {number} id - Organization id to update.
   * @param {Organization} org - Organization data to persist.
   * @param {File} [logoFile] - Optional logo file to upload.
   * @returns {Promise<Organization>} The updated, parsed organization.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async update(
    id: number,
    org: Organization,
    logoFile?: File
  ): Promise<Organization> {
    const payload = organizationToJsonWithIds(org);
    const files = logoFile ? { attachments: [logoFile] } : undefined;
    const data = await api.patchMultipart<ApiResponse>(
      `/organization/web/${id}`,
      payload,
      files
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
};
