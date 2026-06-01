/**
 * types/grn/grn-update.ts
 *
 * Update request DTO for `PATCH /grns/web` (id carried in body).
 * Per the backend OpenAPI spec, the request body is `GoodsReceivedNoteUpdateDto`
 * and the response is `GoodsReceivedNoteDto` (full).
 *
 * Fields are optional; only set fields are transmitted.
 */

export interface UpdateGrnRequest {
  /** Surrogate id of the GRN to update. Required in the body. */
  id: number;
  receivedOn?: string;
  receivedByEmployeeId?: number;
  storageLocationId?: number;
  deliveryChallanNumber?: string;
  invoiceNumber?: string;
  invoiceAmount?: number;
}

export function updateGrnToJson(
  dto: UpdateGrnRequest
): Record<string, unknown> {
  const payload: Record<string, unknown> = { id: dto.id };
  if (dto.receivedOn !== undefined) payload.receivedOn = dto.receivedOn;
  if (dto.receivedByEmployeeId !== undefined)
    payload.receivedByEmployeeId = dto.receivedByEmployeeId;
  if (dto.storageLocationId !== undefined)
    payload.storageLocationId = dto.storageLocationId;
  if (dto.deliveryChallanNumber !== undefined)
    payload.deliveryChallanNumber = dto.deliveryChallanNumber;
  if (dto.invoiceNumber !== undefined)
    payload.invoiceNumber = dto.invoiceNumber;
  if (dto.invoiceAmount !== undefined)
    payload.invoiceAmount = dto.invoiceAmount;
  return payload;
}
