import type { IngestDocument } from '@tornotron/echno-core/document-ingestion/types';

const WORKBOOK_TYPES: Record<string, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
};

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? '' : fileName.slice(dot + 1).toLowerCase();
}

/** Only Excel workbooks are read as a BOQ in this version. */
export function isWorkbookName(fileName: string): boolean {
  return extensionOf(fileName) in WORKBOOK_TYPES;
}

/** The type to presign with: the browser's own, else the one the extension implies. */
export function workbookContentType(file: File): string | undefined {
  return file.type || WORKBOOK_TYPES[extensionOf(file.name)];
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
