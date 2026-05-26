export interface CreateVendorTaxIdentifierRequest {
  type: string;
  value: string;
}

export function createVendorTaxIdentifierToJson(
  dto: CreateVendorTaxIdentifierRequest
): Record<string, unknown> {
  return {
    type: dto.type,
    value: dto.value,
  };
}
