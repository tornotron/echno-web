import type {
  BoqPreviewRow,
  Candidate,
  SourceRef,
} from '@tornotron/echno-core/document-ingestion/types';
import {
  boqItemOf,
  sourceOf,
} from '@tornotron/echno-core/document-ingestion/types';

/** The spreadsheet letter of a 1-based column number: 1 is A, 27 is AA. */
export function columnLetter(col: number): string {
  let n = col;
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCodePoint(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

/** The letters of a cell reference such as `C12`, or none when it has none. */
export function lettersOfRef(ref: string | undefined): string | undefined {
  const match = ref?.match(/^\$?([A-Za-z]+)\$?\d+$/);
  return match ? match[1].toUpperCase() : undefined;
}

export interface PreviewColumn {
  col: number;
  letter: string;
  /** The text in the header row for this column, when there is one. */
  heading?: string;
}

/**
 * Every column that holds a value in the preview, with its letter taken from
 * the cell references and its heading from the chosen header row.
 */
export function previewColumns(
  rows: BoqPreviewRow[],
  headerRow: number | undefined
): PreviewColumn[] {
  const letters = new Map<number, string>();
  for (const row of rows) {
    for (const cell of row.cells) {
      if (cell.col <= 0) continue;
      if (!letters.has(cell.col)) {
        letters.set(cell.col, lettersOfRef(cell.ref) ?? columnLetter(cell.col));
      }
    }
  }
  const header = rows.find((row) => row.row === headerRow);
  return [...letters.entries()]
    .toSorted(([a], [b]) => a - b)
    .map(([col, letter]) => {
      const heading = header?.cells.find((cell) => cell.col === col)?.text;
      return { col, letter, heading: heading?.trim() || undefined };
    });
}

/** Where a BOQ row came from: the source of its description, else its first source. */
export function rowSource(candidate: Candidate): SourceRef | undefined {
  return sourceOf(candidate, 'description') ?? candidate.sources[0];
}

/** `BOQ.xlsx, Sheet BOQ, Row 47`, from the file and the row's source. */
export function sourceLabel(
  candidate: Candidate,
  fileName: string | undefined
): string {
  const item = boqItemOf(candidate);
  const source = rowSource(candidate);
  const sheet = source?.sheet ?? item.sheet;
  const row = source?.rowNumber ?? item.row;
  const parts = [fileName ?? 'Workbook'];
  if (sheet) parts.push(`Sheet ${sheet}`);
  if (row !== undefined) parts.push(`Row ${row}`);
  return parts.join(', ');
}
