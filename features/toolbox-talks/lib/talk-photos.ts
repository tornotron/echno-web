import { attachmentService } from '@tornotron/echno-core/attachment/services';
import type {
  Attachment,
  RegisterUploadRequest,
} from '@tornotron/echno-core/attachment/types';
import { toolboxTalksService } from '@tornotron/echno-core/toolbox-talks/services';

export interface TalkPhotoUploadResult {
  attachments: Attachment[];
  errors: { filename: string; message: string }[];
}

/**
 * The module's photo evidence path: presign one slot per file on the talk,
 * PUT each file straight to storage, then register only the keys whose PUT
 * succeeded. A file that fails is reported by name so the caller can offer
 * a retry; it never blocks the others.
 */
export async function uploadTalkPhotos(
  talkId: string,
  files: File[],
  register: (
    id: string,
    requests: RegisterUploadRequest[]
  ) => Promise<Attachment[]> = (id, requests) =>
    toolboxTalksService.registerPhotos(id, requests)
): Promise<TalkPhotoUploadResult> {
  if (files.length === 0) return { attachments: [], errors: [] };

  const slots = await toolboxTalksService.presignPhotos(
    talkId,
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
    uploaded.length > 0 ? await register(talkId, uploaded) : [];
  return { attachments, errors };
}
