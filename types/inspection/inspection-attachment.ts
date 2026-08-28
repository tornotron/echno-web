import { parsePositiveInt } from '@/types/parse-id';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

/**
 * A stored file referenced by the inspection module.
 *
 * Deliberately a local type rather than echno-core's `Attachment`: that enum
 * has no `video` member, and inspection evidence is video-heavy. The shapes
 * are otherwise compatible, so mapping onto the shared type is a rename once
 * `AttachmentType.video` exists upstream.
 */
export type AttachmentKind = 'image' | 'video' | 'document';

export interface InspectionAttachment {
  id: number;
  fileName: string;
  /** Resolvable URL — an object URL while mocked, a CDN URL once uploaded. */
  url: string;
  kind: AttachmentKind;
  contentType: string;
  fileSize: number;
  uploadedByName?: string;
  createdAt: Date;
}

export function attachmentKindFromMime(contentType: string): AttachmentKind {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  return 'document';
}

export function parseInspectionAttachment(raw: Raw): InspectionAttachment {
  const contentType: string = raw.contentType ?? 'application/octet-stream';

  return {
    id: parsePositiveInt(raw.id, 'parseInspectionAttachment.id'),
    fileName: raw.fileName ?? 'file',
    url: raw.url ?? raw.file ?? '',
    kind: (raw.kind as AttachmentKind) ?? attachmentKindFromMime(contentType),
    contentType,
    fileSize: raw.fileSize ?? 0,
    uploadedByName: raw.uploadedByName ?? undefined,
    createdAt: new Date(raw.createdAt ?? Date.now()),
  };
}

/** Human-readable size, matching how the rest of the app renders file sizes. */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value < 10 && exponent > 0 ? 1 : 0)} ${units[exponent]}`;
}
