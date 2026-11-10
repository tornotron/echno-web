import type { SourceRef } from '@tornotron/echno-core/document-ingestion/types';

/** A normalized box `[x0, y0, x1, y1]`, top-left origin, every value from 0 to 1. */
export type Box = [number, number, number, number];

/** The box of a source when it is one that can be drawn; anything else reads as none. */
export function boxOf(source: SourceRef | undefined): Box | undefined {
  const box = source?.box;
  if (!box || box.length !== 4) return undefined;
  if (!box.every((v) => Number.isFinite(v) && v >= 0 && v <= 1)) {
    return undefined;
  }
  const [x0, y0, x1, y1] = box;
  if (x1 <= x0 || y1 <= y0) return undefined;
  return [x0, y0, x1, y1];
}

function pct(v: number): string {
  return `${Number((v * 100).toFixed(3))}%`;
}

/** The box as CSS percentages of the page it sits on. */
export function boxStyle(box: Box): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  const [x0, y0, x1, y1] = box;
  return {
    left: pct(x0),
    top: pct(y0),
    width: pct(x1 - x0),
    height: pct(y1 - y0),
  };
}

/** Whether a source points into a workbook rather than at a page. */
export function isSheetSource(source: SourceRef): boolean {
  return Boolean(source.sheet || source.cell) && source.page === undefined;
}

/**
 * Where a value was read, in words: `NIT.pdf, page 3`, or
 * `BOQ.xlsx, sheet BOQ, row 47, cell D47` for a workbook.
 */
export function sourcePlace(
  source: SourceRef,
  fileName: string | undefined
): string {
  const parts = [fileName ?? 'File'];
  if (isSheetSource(source)) {
    if (source.sheet) parts.push(`sheet ${source.sheet}`);
    if (source.rowNumber !== undefined) parts.push(`row ${source.rowNumber}`);
    if (source.cell) parts.push(`cell ${source.cell}`);
  } else {
    if (source.page !== undefined) parts.push(`page ${source.page}`);
    if (source.paragraph !== undefined) {
      parts.push(`paragraph ${source.paragraph}`);
    }
  }
  return parts.join(', ');
}
