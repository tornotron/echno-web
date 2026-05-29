export interface CreateWbsElementRequest {
  name: string;
  parentElementId?: number;
  code?: string;
  description?: string;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  status?: string;
  progress?: number;
  allocatedBudget?: number;
  priority?: string;
}

export function createWbsElementToJson(
  dto: CreateWbsElementRequest
): Record<string, unknown> {
  return {
    name: dto.name,
    ...(dto.parentElementId !== undefined && {
      parentElementId: dto.parentElementId,
    }),
    ...(dto.code !== undefined && { code: dto.code }),
    ...(dto.description !== undefined && { description: dto.description }),
    ...(dto.plannedStartDate !== undefined && {
      plannedStartDate: dto.plannedStartDate.toISOString(),
    }),
    ...(dto.plannedEndDate !== undefined && {
      plannedEndDate: dto.plannedEndDate.toISOString(),
    }),
    ...(dto.status !== undefined && { status: dto.status }),
    ...(dto.progress !== undefined && { progress: dto.progress }),
    ...(dto.allocatedBudget !== undefined && {
      allocatedBudget: dto.allocatedBudget,
    }),
    ...(dto.priority !== undefined && { priority: dto.priority }),
  };
}

export interface BulkCreateWbsElementsRequest {
  elements: CreateWbsElementRequest[];
}

export function bulkCreateWbsElementsToJson(
  dto: BulkCreateWbsElementsRequest
): Record<string, unknown> {
  return {
    elements: dto.elements.map((el) => createWbsElementToJson(el)),
  };
}

export interface MoveWbsElementRequest {
  newParentId?: number | null;
  newPosition?: number;
}

export function moveWbsElementToJson(
  dto: MoveWbsElementRequest
): Record<string, unknown> {
  return {
    ...(dto.newParentId !== undefined && { newParentId: dto.newParentId }),
    ...(dto.newPosition !== undefined && { newPosition: dto.newPosition }),
  };
}
