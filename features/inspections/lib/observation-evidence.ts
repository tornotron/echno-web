import { attachmentService } from '@tornotron/echno-core/attachment/services';
import type { Attachment } from '@tornotron/echno-core/attachment/types';
import { observationService } from '@tornotron/echno-core/observation/services';

/**
 * Puts files on an observation as evidence through the presigned
 * direct-to-storage flow the attachment store already uses, with the
 * presign and register steps on the observation's own paths (owner type
 * `OBSERVATION_EVIDENCE`): one slot per file, the bytes PUT straight to
 * storage, then only the keys whose PUT succeeded are registered.
 *
 * Returns what registered and which files failed. A file whose PUT fails
 * is left out of the register call so the backend never records a key that
 * is not in storage.
 */
export async function uploadObservationEvidence(
  observationId: string,
  files: File[]
): Promise<{
  attachments: Attachment[];
  errors: { filename: string; message: string }[];
}> {
  if (files.length === 0) return { attachments: [], errors: [] };
  const slots = await observationService.presignEvidence(
    observationId,
    files.map((file) => ({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      fileSize: file.size,
    }))
  );
  const errors: { filename: string; message: string }[] = [];
  const uploaded: {
    key: string;
    filename: string;
    contentType: string;
    fileSize: number;
  }[] = [];
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
    uploaded.length > 0
      ? await observationService.registerEvidence(observationId, uploaded)
      : [];
  return { attachments, errors };
}
