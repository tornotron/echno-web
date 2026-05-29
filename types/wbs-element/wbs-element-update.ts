export interface UpdateWbsElementRequest {
  name: string;
  code?: string;
  description?: string;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  status?: string;
  progress?: number;
  allocatedBudget?: number;
  priority?: string;
}

export function updateWbsElementToJson(
  dto: UpdateWbsElementRequest
): Record<string, unknown> {
  return {
    name: dto.name,
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
