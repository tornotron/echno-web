import type { IngestDocument } from '@tornotron/echno-core/document-ingestion/types';

const WORKBOOK_TYPES: Record<string, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
};

/** Every file type a package takes, by extension, with the type to presign with. */
const INGEST_TYPES: Record<string, string> = {
  ...WORKBOOK_TYPES,
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  dxf: 'image/vnd.dxf',
  dwg: 'image/vnd.dwg',
  zip: 'application/zip',
};

/** The `accept` list of the upload input. */
export const INGEST_ACCEPT = Object.keys(INGEST_TYPES)
  .map((ext) => `.${ext}`)
  .join(',');

/** The largest single file a package takes, as the backend refuses at presign. */
export const MAX_INGEST_FILE_BYTES = 200 * 1024 * 1024;

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase();
}

/** A file a package takes: PDF, Excel, Word, a drawing, or a ZIP of them. */
export function isIngestFileName(fileName: string): boolean {
  return extensionOf(fileName) in INGEST_TYPES;
}

/** The type to presign any package file with: the browser's own, else the one the extension implies. */
export function ingestContentType(file: File): string | undefined {
  return file.type || INGEST_TYPES[extensionOf(file.name)];
}

/** A file that was read and holds sheets to map. */
export function isReadWorkbook(doc: IngestDocument): boolean {
  const type = doc.fileType ?? extensionOf(doc.fileName).toUpperCase();
  return doc.status === 'PARSED' && (type === 'XLSX' || type === 'XLS');
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
