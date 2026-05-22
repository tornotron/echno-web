// TODO: Phase 4 — implement UploadAttachmentRequest and replace positional params in attachment-service
export interface UploadAttachmentRequest {
  entityId: number;
  entityType: string;
  files: File | File[];
}
