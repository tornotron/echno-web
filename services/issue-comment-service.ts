import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import { IssueComment, parseIssueComment } from '@/types/issue/issue-comment';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = any;

/**
 * Safely parse comment data with error handling.
 * @throws {ApiError} when parsing fails
 */
function safeParseIssueComment(data: ApiResponse): IssueComment {
  try {
    return parseIssueComment(data);
  } catch (error) {
    logger.error('Failed to parse issue comment data:', error);
    throw new ApiError(
      'Failed to process issue comment data. Please try again.',
      422
    );
  }
}

/**
 * Safely parse comment array with error handling.
 * @throws {ApiError} when parsing fails
 */
function safeParseIssueComments(data: ApiResponse[]): IssueComment[] {
  if (!Array.isArray(data)) {
    return [];
  }
  try {
    return data.map((item) => parseIssueComment(item));
  } catch (error) {
    logger.error('Failed to parse issue comments data:', error);
    throw new ApiError(
      'Failed to process issue comments data. Please try again.',
      422
    );
  }
}

/**
 * Convert partial comment data to JSON for API requests.
 * Only includes fields that are actually provided.
 */
export function partialIssueCommentToJson(
  comment: Partial<IssueComment>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (comment.id !== undefined) payload.id = comment.id;
  if (comment.comment !== undefined) payload.comment = comment.comment;
  if (comment.authorId !== undefined) payload.authorId = comment.authorId;
  else if (comment.author !== undefined) payload.authorId = comment.author?.id;

  return payload;
}

/**
 * issueCommentService
 *
 * Thin wrapper around the backend issue comment REST endpoints.
 */
export const issueCommentService = {
  /**
   * Fetch all issue comments.
   */
  async getAll(): Promise<IssueComment[]> {
    const data = await api.get<ApiResponse[]>('/issues/comments/web');
    return safeParseIssueComments(data);
  },

  /**
   * Fetch a single issue comment by id.
   */
  async getById(id: number): Promise<IssueComment> {
    const data = await api.get<ApiResponse>(`/issues/comments/web/${id}`);
    return safeParseIssueComment(data);
  },

  /**
   * Create a new comment on an issue.
   *
   * @param {number} issueId - The parent issue to attach the comment to.
   * @param {Partial<IssueComment>} commentData - Comment payload.
   * @returns {Promise<IssueComment>} The created, parsed comment.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async create(
    issueId: number,
    commentData: Partial<IssueComment>
  ): Promise<IssueComment> {
    const payload = partialIssueCommentToJson(commentData);
    payload.issueId = issueId;

    const data = await api.post<ApiResponse>('/issues/comments/web', payload);
    return safeParseIssueComment(data);
  },

  /**
   * Update an existing issue comment.
   *
   * @param {number} id - Comment id to update.
   * @param {Partial<IssueComment>} commentData - Fields to update.
   * @returns {Promise<IssueComment>} The updated, parsed comment.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async update(
    id: number,
    commentData: Partial<IssueComment>
  ): Promise<IssueComment> {
    const payload = partialIssueCommentToJson(commentData);
    const data = await api.patch<ApiResponse>(
      `/issues/comments/web/${id}`,
      payload
    );
    return safeParseIssueComment(data);
  },

  /**
   * Fetch all comments belonging to a specific issue.
   */
  async getByIssueId(issueId: number): Promise<IssueComment[]> {
    const data = await api.get<ApiResponse[]>(
      `/issues/comments/web/issueId/${issueId}`
    );
    return safeParseIssueComments(data);
  },

  /**
   * Delete an issue comment by id.
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/issues/comments/web/${id}`);
  },
};
