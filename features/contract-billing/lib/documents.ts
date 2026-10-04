import { attachmentService } from '@tornotron/echno-core/attachment/services';
import type {
  Attachment,
  RegisterUploadRequest,
} from '@tornotron/echno-core/attachment/types';
import { contractBillingService } from '@tornotron/echno-core/contract-billing/services';
import type { BillDocumentType } from '@tornotron/echno-core/contract-billing/types';

export interface DocumentUploadResult {
  attachments: Attachment[];
  errors: { filename: string; message: string }[];
}

/**
 * A bill's supporting-document path, as for progress inspection evidence:
 * presign one slot per file on the bill, PUT each file straight to storage,
 * then register only the keys whose PUT succeeded, under one document type.
 * A file that fails is reported by name; it never blocks the others.
 */
export async function uploadBillDocuments(
  billId: string,
  files: File[],
  documentType: BillDocumentType,
  register: (
    id: string,
    uploads: RegisterUploadRequest[],
    type: BillDocumentType
  ) => Promise<Attachment[]> = (id, uploads, type) =>
    contractBillingService.registerDocuments(id, uploads, type)
): Promise<DocumentUploadResult> {
  if (files.length === 0) return { attachments: [], errors: [] };

  const slots = await contractBillingService.presignDocuments(
    billId,
    files.map((file) => ({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      fileSize: file.size,
    }))
  );

  const errors: { filename: string; message: string }[] = [];
  const uploaded: RegisterUploadRequest[] = [];

  await Promise.all(
    files.map(async (file, index) => {
      const slot = slots[index];
      if (!slot) {
        errors.push({
          filename: file.name,
          message: 'No upload slot was issued.',
        });
        return;
      }
      try {
        await attachmentService.putToStorage(slot.url, file, slot.contentType);
        uploaded.push({
          key: slot.key,
          filename: file.name,
          contentType: slot.contentType,
          fileSize: file.size,
        });
      } catch (error) {
        errors.push({
          filename: file.name,
          message: error instanceof Error ? error.message : 'Upload failed.',
        });
      }
    })
  );

  const attachments =
    uploaded.length > 0 ? await register(billId, uploaded, documentType) : [];
  return { attachments, errors };
}
