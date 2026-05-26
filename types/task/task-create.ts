// TODO: Phase 10 — implement createTaskToJson and replace Partial<Task> in task-service
// Backend contract: POST /api/v1/tasks/web (multipart/form-data), docs/backend-api-docs.md §7
export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: string;
  assignedTo?: number;
  status?: string;
  category?: string;
  tags?: string[];
}

export interface TaskFiles {
  attachments?: File[];
}
