import type { IndentStatus } from './enums';
import type { CreateIndentItemRequest } from './indent-item-create';

export interface UpdateIndentRequest {
  indentNumber?: string;
  status?: IndentStatus;
  expectedOn?: string;
  remarks?: string;
  projectId?: number;
  items?: CreateIndentItemRequest[];
}

export function updateIndentToJson(
  dto: UpdateIndentRequest
): Record<string, unknown> {
  return {
    indentNumber: dto.indentNumber,
    status: dto.status,
    expectedOn: dto.expectedOn,
    remarks: dto.remarks,
    projectId: dto.projectId,
    items: dto.items,
  };
}
