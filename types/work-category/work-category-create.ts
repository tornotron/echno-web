export interface CreateWorkCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
}

export function createWorkCategoryToJson(
  dto: CreateWorkCategoryRequest
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: dto.name,
    description: dto.description ?? '',
  };
  if (dto.icon) payload.icon = dto.icon;
  return payload;
}
