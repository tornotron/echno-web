import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import { Task, parseTask } from '@/types/task';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResponse = any;

/**
 * Files that can be uploaded for a task.
 */
export interface TaskFiles {
  attachments?: File[];
}

/**
 * Safely parse task data with error handling.
 * @throws {ApiError} when parsing fails
 */
function safeParseTask(data: ApiResponse): Task {
  try {
    return parseTask(data);
  } catch (error) {
    logger.error('Failed to parse task data:', error);
    throw new ApiError('Failed to process task data. Please try again.', 422);
  }
}

/**
 * Safely parse task array with error handling.
 * @throws {ApiError} when parsing fails
 */
function safeParseTasks(data: ApiResponse[]): Task[] {
  if (!Array.isArray(data)) {
    return [];
  }
  try {
    return data.map((item) => parseTask(item));
  } catch (error) {
    logger.error('Failed to parse tasks data:', error);
    throw new ApiError('Failed to process tasks data. Please try again.', 422);
  }
}

/**
 * Convert partial task data to JSON for API requests.
 * Only includes fields that are actually provided in the partial task object.
 */
export function partialTaskToJson(
  task: Partial<Task>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (task.id !== undefined) payload.id = task.id;
  if (task.projectId !== undefined) payload.projectId = task.projectId;
  if (task.title !== undefined) payload.title = task.title;
  if (task.description !== undefined) payload.description = task.description;
  if (task.startDate !== undefined)
    payload.startDate = task.startDate.toISOString();
  if (task.endDate !== undefined) payload.endDate = task.endDate.toISOString();
  if (task.creator?.id !== undefined) payload.creatorId = task.creator.id;
  if (task.assignees !== undefined) {
    payload.assigneeIds = task.assignees
      .filter((a) => a.id !== undefined)
      .map((a) => a.id);
  }
  if (task.category?.id !== undefined) payload.categoryId = task.category.id;
  if (task.progress !== undefined) payload.progress = task.progress;
  if (task.tags !== undefined) payload.tags = task.tags ?? [];
  if (task.status !== undefined) payload.status = task.status;

  return payload;
}

/**
 * taskService
 *
 * Thin wrapper around the backend task REST endpoints.
 */
export const taskService = {
  /**
   * Fetch all tasks.
   */
  async getAll(): Promise<Task[]> {
    const data = await api.get<ApiResponse[]>('/tasks/web');
    return safeParseTasks(data);
  },

  /**
   * Fetch a single task by id.
   */
  async getById(id: number): Promise<Task> {
    const data = await api.get<ApiResponse>(`/tasks/web/${id}`);
    return safeParseTask(data);
  },

  /**
   * Create a new task.
   * Uses multipart/form-data with 'data' JSON field.
   */
  async create(taskData: Partial<Task>): Promise<Task> {
    const payload = partialTaskToJson(taskData);
    const data = await api.postMultipart<ApiResponse>('/tasks/web', payload);
    return safeParseTask(data);
  },

  /**
   * Create a new task with file uploads.
   * Uses multipart/form-data to send both JSON data and files.
   *
   * Backend expects:
   * - 'data' field: JSON string of task data
   * - 'attachments' field(s): File objects
   *
   * @param {Partial<Task>} taskData - Task data to persist.
   * @param {TaskFiles} files - Files to upload (attachments).
   * @returns {Promise<Task>} The created, parsed task.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async createWithFiles(
    taskData: Partial<Task>,
    files: TaskFiles
  ): Promise<Task> {
    const payload = partialTaskToJson(taskData);
    const hasFiles = files.attachments && files.attachments.length > 0;

    // Send empty attachments array in JSON when no files,
    // so the backend doesn't receive null
    if (!hasFiles) {
      payload.attachments = [];
    }

    const data = await api.postMultipart<ApiResponse>(
      '/tasks/web',
      payload,
      hasFiles ? { attachments: files.attachments! } : undefined
    );
    return safeParseTask(data);
  },

  /**
   * Update an existing task.
   * Uses multipart/form-data with 'data' JSON field.
   */
  async update(id: number, taskData: Partial<Task>): Promise<Task> {
    const payload = partialTaskToJson(taskData);
    const data = await api.patchMultipart<ApiResponse>(
      `/tasks/web/${id}`,
      payload
    );
    return safeParseTask(data);
  },

  /**
   * Update an existing task with file uploads.
   * Uses multipart/form-data to send both JSON data and files.
   *
   * Backend expects:
   * - 'data' field: JSON string of task data
   * - 'attachments' field(s): File objects
   *
   * @param {number} id - Task id to update.
   * @param {Partial<Task>} taskData - Task data to persist.
   * @param {TaskFiles} files - Files to upload (attachments).
   * @returns {Promise<Task>} The updated, parsed task.
   * @throws {ApiError} on network, server, or parsing errors
   */
  async updateWithFiles(
    id: number,
    taskData: Partial<Task>,
    files: TaskFiles
  ): Promise<Task> {
    const payload = partialTaskToJson(taskData);
    const hasFiles = files.attachments && files.attachments.length > 0;

    // Send empty attachments array in JSON when no files,
    // so the backend doesn't receive null
    if (!hasFiles) {
      payload.attachments = [];
    }

    const data = await api.patchMultipart<ApiResponse>(
      `/tasks/web/${id}`,
      payload,
      hasFiles ? { attachments: files.attachments! } : undefined
    );
    return safeParseTask(data);
  },

  /**
   * Delete a task by id.
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/tasks/web/${id}`);
  },
};
