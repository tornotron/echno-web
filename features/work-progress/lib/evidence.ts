import { attachmentService } from '@tornotron/echno-core/attachment/services';
import type {
  Attachment,
  RegisterUploadRequest,
} from '@tornotron/echno-core/attachment/types';
import { workProgressService } from '@tornotron/echno-core/work-progress/services';

export interface EvidenceUploadResult {
  attachments: Attachment[];
  errors: { filename: string; message: string }[];
}

/**
 * A progress inspection's evidence path: presign one slot per file on the
 * record, PUT each file straight to storage, then register only the keys
 * whose PUT succeeded. A file that fails is reported by name; it never
 * blocks the others.
 */
export async function uploadProgressEvidence(
  inspectionId: string,
  files: File[],
  register: (
    id: string,
    uploads: RegisterUploadRequest[]
  ) => Promise<Attachment[]> = (id, uploads) =>
    workProgressService.registerEvidence(id, uploads)
): Promise<EvidenceUploadResult> {
  if (files.length === 0) return { attachments: [], errors: [] };

  const slots = await workProgressService.presignEvidence(
    inspectionId,
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
    uploaded.length > 0 ? await register(inspectionId, uploaded) : [];
  return { attachments, errors };
}
