import type { IndentStatus } from './enums';
import type { CreateIndentItemRequest } from './indent-item-create';

export interface CreateIndentRequest {
  indentNumber: string;
  createdByEmployeeId: number;
  status: IndentStatus;
  expectedOn?: string;
  remarks?: string;
  projectId?: number;
  items: CreateIndentItemRequest[];
}

export function createIndentToJson(
  dto: CreateIndentRequest
): Record<string, unknown> {
  return {
    indentNumber: dto.indentNumber,
    createdByEmployeeId: dto.createdByEmployeeId,
    status: dto.status,
    expectedOn: dto.expectedOn,
    remarks: dto.remarks,
    projectId: dto.projectId,
    items: dto.items,
  };
}
