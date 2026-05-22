// TODO: Phase 10 — implement UpdateTaskRequest (once backend documents update contract)
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: Date;
  priority?: string;
  assignedTo?: number;
  status?: string;
  category?: string;
  tags?: string;
}
