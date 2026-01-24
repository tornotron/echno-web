import { api } from '@/lib/api/api-client';
import {
  Organization,
  organizationToJsonWithIds,
  parseOrganization,
} from '@/types/organization/organization';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = any;

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
 */
export const organizationService = {
  /**
   * Fetch all organizations.
   *
   * @returns {Promise<Organization[]>} Resolves with an array of parsed organizations.
   */
  async getAll(): Promise<Organization[]> {
    const data = await api.get<ApiResponse[]>('/organization/web');
    return Array.isArray(data)
      ? data.map((item) => parseOrganization(item))
      : [];
  },

  /**
   * Fetch organizations created by a specific user.
   *
   * @param {number} creatorId - The numeric id of the creator user.
   * @returns {Promise<Organization[]>} Resolves with an array of parsed organizations.
   */
  async getByCreator(creatorId: number): Promise<Organization[]> {
    const data = await api.get<ApiResponse[]>(
      `/organization/web/creator/${creatorId}`
    );
    return Array.isArray(data)
      ? data.map((item) => parseOrganization(item))
      : [];
  },

  /**
   * Fetch a single organization by id.
   *
   * @param {number} id - Organization id.
   * @returns {Promise<Organization>} Parsed organization object.
   */
  async getById(id: number): Promise<Organization> {
    const data = await api.get<ApiResponse>(`/organization/web/${id}`);
    return parseOrganization(data);
  },

  /**
   * Update an existing organization.
   *
   * @param {number} id - Organization id to update.
   * @param {Organization} org - Organization data to persist.
   * @returns {Promise<Organization>} The updated, parsed organization.
   */
  async update(id: number, org: Organization): Promise<Organization> {
    const payload = organizationToJsonWithIds(org);
    const data = await api.patch<ApiResponse>(
      `/organization/web/${id}`,
      payload
    );
    return parseOrganization(data);
  },

  /**
   * Create a new organization.
   *
   * @param {Organization} org - Organization data to create.
   * @returns {Promise<Organization>} The created, parsed organization.
   */
  async create(org: Organization): Promise<Organization> {
    const payload = organizationToJsonWithIds(org);
    const data = await api.post<ApiResponse>('/organization/web', payload);
    return parseOrganization(data);
  },

  /**
   * Delete an organization by id.
   *
   * @param {number} id - Organization id to delete.
   * @returns {Promise<void>} Resolves when delete completes.
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/organization/web/${id}`);
  },
};
