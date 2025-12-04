// types/attachment/attachment.ts

export enum AttachmentType {
  image = 'image',
  pdf = 'pdf',
  document = 'document', // docx, doc, txt
  spreadsheet = 'spreadsheet', // xlsx, xls, csv
  cad = 'cad', // dwg, dxf, step
  other = 'other',
}

export interface Attachment {
  id?: number;
  fileName: string;
  fileUrl: string;
  fileSize: number; // in bytes
  fileType: AttachmentType;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: string;
  description?: string;
}

/** Helper: Get file type from mime type */
export function getFileTypeFromMimeType(mimeType: string): AttachmentType {
  if (mimeType.startsWith('image/')) return AttachmentType.image;
  if (mimeType === 'application/pdf') return AttachmentType.pdf;
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    mimeType === 'text/plain'
  ) {
    return AttachmentType.document;
  }
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'text/csv'
  ) {
    return AttachmentType.spreadsheet;
  }
  if (
    mimeType === 'application/acad' ||
    mimeType === 'application/x-acad' ||
    mimeType === 'application/dxf'
  ) {
    return AttachmentType.cad;
  }
  return AttachmentType.other;
}

/** Helper: Get file extension */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? (parts.at(-1) ?? '').toLowerCase() : '';
}

/** Helper: Format file size */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/** Helper: Get icon name for file type */
export function getFileTypeIcon(type: AttachmentType): string {
  const iconMap: Record<AttachmentType, string> = {
    [AttachmentType.image]: 'image',
    [AttachmentType.pdf]: 'file-text',
    [AttachmentType.document]: 'file-text',
    [AttachmentType.spreadsheet]: 'table',
    [AttachmentType.cad]: 'box',
    [AttachmentType.other]: 'file',
  };
  return iconMap[type];
}

/** Helper: Get color for file type */
export function getFileTypeColor(type: AttachmentType): string {
  const colorMap: Record<AttachmentType, string> = {
    [AttachmentType.image]: '#10B981', // green
    [AttachmentType.pdf]: '#EF4444', // red
    [AttachmentType.document]: '#3B82F6', // blue
    [AttachmentType.spreadsheet]: '#10B981', // green
    [AttachmentType.cad]: '#8B5CF6', // purple
    [AttachmentType.other]: '#6B7280', // gray
  };
  return colorMap[type];
}

/** JSON → Attachment */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseAttachment(json: any): Attachment {
  return {
    id: json.id ?? undefined,
    fileName: json.fileName ?? '',
    fileUrl: json.fileUrl ?? '',
    fileSize: json.fileSize ?? 0,
    fileType: json.fileType ?? AttachmentType.other,
    mimeType: json.mimeType ?? '',
    uploadedAt: new Date(json.uploadedAt),
    uploadedBy: json.uploadedBy ?? '',
    description: json.description ?? undefined,
  };
}

/** Attachment → JSON */
export function attachmentToJson(
  attachment: Attachment
): Record<string, unknown> {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    fileUrl: attachment.fileUrl,
    fileSize: attachment.fileSize,
    fileType: attachment.fileType,
    mimeType: attachment.mimeType,
    uploadedAt: attachment.uploadedAt.toISOString(),
    uploadedBy: attachment.uploadedBy,
    description: attachment.description,
  };
}
