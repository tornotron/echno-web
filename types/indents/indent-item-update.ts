export interface UpdateIndentItemRequest {
  indentId?: number;
  materialId?: number;
  requestedQuantity?: number;
  orderedQuantity?: number;
  additionalSpecifications?: string;
  remarks?: string;
}

export function updateIndentItemToJson(
  dto: UpdateIndentItemRequest
): Record<string, unknown> {
  return {
    indentId: dto.indentId,
    materialId: dto.materialId,
    requestedQuantity: dto.requestedQuantity,
    orderedQuantity: dto.orderedQuantity,
    additionalSpecifications: dto.additionalSpecifications,
    remarks: dto.remarks,
  };
}
