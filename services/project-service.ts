import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import { Project, parseProject, projectToJson } from '@/types/project/project';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = any;

/**
 * Safely parse project data with error handling.
 * @throws {ApiError} when parsing fails
 */
function safeParseProject(data: ApiResponse): Project {
  try {
    return parseProject(data);
  } catch (error) {
    logger.error('Failed to parse project data:', error);
    throw new ApiError(
      'Failed to process project data. Please try again.',
      422
    );
  }
}

/**
 * Safely parse project array with error handling.
 * @throws {ApiError} when parsing fails
 */
function safeParseProjects(data: ApiResponse[]): Project[] {
  if (!Array.isArray(data)) {
    return [];
  }
  try {
    return data.map((item) => parseProject(item));
  } catch (error) {
    logger.error('Failed to parse projects data:', error);
    throw new ApiError(
      'Failed to process projects data. Please try again.',
      422
    );
  }
}

/**
 * Convert partial project data to JSON for API requests.
 * Only includes fields that are actually provided in the partial project object.
 */
export function partialProjectToJson(
  project: Partial<Project>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (project.id !== undefined) payload.id = project.id;
  if (project.projectName !== undefined)
    payload.projectName = project.projectName;
  if (project.projectAddress !== undefined)
    payload.projectAddress = project.projectAddress;
  if (project.status !== undefined) payload.status = project.status;
  if (project.projectLongitude !== undefined)
    payload.projectLongitude = project.projectLongitude;
  if (project.projectLatitude !== undefined)
    payload.projectLatitude = project.projectLatitude;
  if (project.organizationId !== undefined)
    payload.organizationId = project.organizationId;
  if (project.startDate !== undefined)
    payload.startDate = project.startDate.toISOString();
  if (project.endDate !== undefined)
    payload.endDate = project.endDate.toISOString();
  if (project.members !== undefined) {
    payload.employees = project.members.map((e) => e.id);
  }
  // Note: attachments are handled separately via multipart

  return payload;
}

/**
 * Files that can be uploaded for a project.
 */
export interface ProjectFiles {
  attachments?: File[];
}

/**
 * projectService
 *
 * Thin wrapper around the backend project REST endpoints. Provides
 * typed, parse-safe convenience methods for common project CRUD
 * operations used throughout the application.
 *
 * Implementation notes:
 * - This module expects the backend to return JSON payloads compatible
 *   with `parseProject` and `projectToJson` helpers.
 * - Network errors and non-2xx responses are propagated from the API
 *   client and should be handled by callers (e.g. via React Query
 *   mutation error handlers).
 * - Parsing errors are wrapped in ApiError for consistent error handling.
 * - File uploads use multipart/form-data with 'data' and 'attachments' fields.
 */
export const projectService = {
  /**
   * Fetch all projects.
   *
   * @returns {Promise<Project[]>} Resolves with an array of parsed projects.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async getAll(): Promise<Project[]> {
    const data = await api.get<ApiResponse[]>('/project/web');
    return safeParseProjects(data);
  },

  /**
   * Fetch a single project by id.
   *
   * @param {number} id - Project id.
   * @returns {Promise<Project>} Parsed project object.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async getById(id: number): Promise<Project> {
    const data = await api.get<ApiResponse>(`/project/web/${id}`);
    return safeParseProject(data);
  },

  /**
   * Fetch projects by organization id.
   *
   * @param {number} organizationId - The numeric id of the organization.
   * @returns {Promise<Project[]>} Resolves with an array of parsed projects.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async getByOrganization(organizationId: number): Promise<Project[]> {
    const data = await api.get<ApiResponse[]>(
      `/project/web/organization/${organizationId}`
    );
    return safeParseProjects(data);
  },

  /**
   * Create a new project (JSON only, no files).
   *
   * @param {Partial<Project>} projectData - Project data to create.
   * @returns {Promise<Project>} The created, parsed project.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async create(projectData: Partial<Project>): Promise<Project> {
    const payload = partialProjectToJson(projectData);
    const data = await api.post<ApiResponse>('/project/web', payload);
    return safeParseProject(data);
  },

  /**
   * Update an existing project (JSON only, no files).
   *
   * @param {number} id - Project id to update.
   * @param {Partial<Project>} projectData - Project data to update.
   * @returns {Promise<Project>} The updated, parsed project.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async update(id: number, projectData: Partial<Project>): Promise<Project> {
    const payload = partialProjectToJson(projectData);
    const data = await api.patch<ApiResponse>(`/project/web/${id}`, payload);
    return safeParseProject(data);
  },

  /**
   * Delete a project by id.
   *
   * @param {number} id - Project id to delete.
   * @returns {Promise<void>} Resolves when delete completes.
   * @throws {ApiError} on network or server errors
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/project/web/${id}`);
  },

  /**
   * Create a new project with file uploads.
   * Uses multipart/form-data to send both JSON data and files.
   *
   * Backend expects:
   * - 'data' field: JSON string of project data
   * - 'attachments' field(s): File objects
   *
   * @param {Partial<Project>} projectData - Project data to create.
   * @param {ProjectFiles} files - Files to upload (attachments).
   * @returns {Promise<Project>} The created, parsed project.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async createWithFiles(
    projectData: Partial<Project>,
    files: ProjectFiles
  ): Promise<Project> {
    const payload = partialProjectToJson(projectData);

    const data = await api.postMultipart<ApiResponse>(
      '/project/web',
      payload,
      files.attachments && files.attachments.length > 0
        ? { attachments: files.attachments }
        : undefined
    );
    return safeParseProject(data);
  },

  /**
   * Update an existing project with file uploads.
   * Uses multipart/form-data to send both JSON data and files.
   *
   * Backend expects:
   * - 'data' field: JSON string of project data
   * - 'attachments' field(s): File objects
   *
   * @param {number} id - Project id to update.
   * @param {Partial<Project>} projectData - Project data to persist.
   * @param {ProjectFiles} files - Files to upload (attachments).
   * @returns {Promise<Project>} The updated, parsed project.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async updateWithFiles(
    id: number,
    projectData: Partial<Project>,
    files: ProjectFiles
  ): Promise<Project> {
    const payload = partialProjectToJson(projectData);
    const hasFiles = files.attachments && files.attachments.length > 0;

    // Send empty attachments array in JSON when no files,
    // so the backend doesn't receive null
    if (!hasFiles) {
      payload.attachments = [];
    }

    const data = await api.patchMultipart<ApiResponse>(
      `/project/web/${id}`,
      payload,
      hasFiles ? { attachments: files.attachments! } : undefined
    );
    return safeParseProject(data);
  },

  /**
   * Add an employee to a project.
   *
   * @param {number} projectId - Project id.
   * @param {number} employeeId - Employee id to add.
   * @returns {Promise<Project>} The updated, parsed project.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async addEmployee(projectId: number, employeeId: number): Promise<Project> {
    const data = await api.post<ApiResponse>(
      `/project/web/${projectId}/employees/${employeeId}`,
      {}
    );
    return safeParseProject(data);
  },

  /**
   * Remove an employee from a project.
   *
   * @param {number} projectId - Project id.
   * @param {number} employeeId - Employee id to remove.
   * @returns {Promise<void>}
   * @throws {ApiError} on network, server, or parsing errors
   */
  async removeEmployee(projectId: number, employeeId: number): Promise<void> {
    await api.delete(`/project/web/${projectId}/employees/${employeeId}`);
  },
};
