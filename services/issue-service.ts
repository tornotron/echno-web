import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import { Issue, parseIssue, IssueFiles } from '@/types/issue';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = any;

/**
 * Safely parse issue data with error handling.
 * @throws {ApiError} when parsing fails
 */
function safeParseIssue(data: ApiResponse): Issue {
  try {
    return parseIssue(data);
  } catch (error) {
    logger.error('Failed to parse issue data:', error);
    throw new ApiError('Failed to process issue data. Please try again.', 422);
  }
}

/**
 * Safely parse issue array with error handling.
 * @throws {ApiError} when parsing fails
 */
function safeParseIssues(data: ApiResponse[]): Issue[] {
  if (!Array.isArray(data)) {
    logger.error(
      'Invalid issues payload: expected array, received:',
      `type=${typeof data}, isNull=${data === null}${
        typeof data === 'object' && data !== null
          ? `, keys=${Object.keys(data).slice(0, 5).join(',')}`
          : ''
      }`
    );
    throw new ApiError('Invalid issues payload: expected array.', 422);
  }
  try {
    return data.map((item) => parseIssue(item));
  } catch (error) {
    logger.error('Failed to parse issues data:', error);
    throw new ApiError('Failed to process issues data. Please try again.', 422);
  }
}

/**
 * Convert partial issue data to JSON for API requests.
 * Only includes fields that are actually provided in the partial issue object.
 */
export function partialIssueToJson(
  issue: Partial<Issue>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (issue.id !== undefined) payload.id = issue.id;
  if (issue.taskId !== undefined) payload.taskId = issue.taskId;
  if (issue.title !== undefined) payload.title = issue.title;
  if (issue.description !== undefined) payload.description = issue.description;
  if (issue.type !== undefined) payload.type = issue.type;
  if (issue.status !== undefined) payload.status = issue.status;
  if (issue.creatorId !== undefined) payload.createdById = issue.creatorId;
  else if (issue.creator !== undefined) payload.createdById = issue.creator?.id;
  if (issue.assigneeId !== undefined) payload.assignedToId = issue.assigneeId;
  else if (issue.assignee !== undefined)
    payload.assignedToId = issue.assignee?.id;

  return payload;
}

/**
 * issueService
 *
 * Thin wrapper around the backend issue REST endpoints.
 */
export const issueService = {
  /**
   * Fetch all issues.
   */
  async getAll(): Promise<Issue[]> {
    const data = await api.get<ApiResponse[]>('/issues/web');
    return safeParseIssues(data);
  },

  /**
   * Fetch a single issue by id.
   */
  async getById(id: number): Promise<Issue> {
    const data = await api.get<ApiResponse>(`/issues/web/${id}`);
    return safeParseIssue(data);
  },

  /**
   * Create a new issue with optional file attachments.
   * Uses multipart/form-data to send both JSON data and files.
   *
   * Backend expects:
   * - 'data' field: JSON string of issue data
   * - 'attachments' field(s): File objects
   *
   * @param {Partial<Issue>} issueData - Issue data to persist.
   * @param {IssueFiles} files - Files to upload (attachments).
   * @returns {Promise<Issue>} The created, parsed issue.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async createWithFiles(
    issueData: Partial<Issue>,
    files: IssueFiles
  ): Promise<Issue> {
    const payload = partialIssueToJson(issueData);
    const hasFiles = files.attachments && files.attachments.length > 0;

    // Send empty attachments array in JSON when no files,
    // so the backend doesn't receive null
    if (!hasFiles) {
      payload.attachments = [];
    }

    const data = await api.postMultipart<ApiResponse>(
      '/issues/web',
      payload,
      hasFiles ? { attachments: files.attachments! } : undefined
    );
    return safeParseIssue(data);
  },

  /**
   * Update an existing issue with optional file attachments.
   * Uses multipart/form-data to send both JSON data and files.
   *
   * Backend expects:
   * - 'data' field: JSON string of issue data
   * - 'attachments' field(s): File objects
   *
   * @param {number} id - Issue id to update.
   * @param {Partial<Issue>} issueData - Issue data to persist.
   * @param {IssueFiles} files - Files to upload (attachments).
   * @returns {Promise<Issue>} The updated, parsed issue.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async updateWithFiles(
    id: number,
    issueData: Partial<Issue>,
    files: IssueFiles
  ): Promise<Issue> {
    const payload = partialIssueToJson(issueData);
    const hasFiles = files.attachments && files.attachments.length > 0;

    // Send empty attachments array in JSON when no files,
    // so the backend doesn't receive null
    if (!hasFiles) {
      payload.attachments = [];
    }

    const data = await api.patchMultipart<ApiResponse>(
      `/issues/web/${id}`,
      payload,
      hasFiles ? { attachments: files.attachments! } : undefined
    );
    return safeParseIssue(data);
  },

  /**
   * Fetch all issues belonging to a specific project.
   */
  async getByProjectId(projectId: number): Promise<Issue[]> {
    const data = await api.get<ApiResponse[]>(
      `/issues/web/project/${projectId}`
    );
    return safeParseIssues(data);
  },

  /**
   * Fetch all issues belonging to a specific task.
   */
  async getByTaskId(taskId: number): Promise<Issue[]> {
    const data = await api.get<ApiResponse[]>(`/issues/web/taskId/${taskId}`);
    return safeParseIssues(data);
  },

  /**
   * Delete an issue by id.
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/issues/web/${id}`);
  },
};
