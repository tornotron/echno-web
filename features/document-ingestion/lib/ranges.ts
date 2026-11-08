import type {
  ClassRange,
  DocClass,
  IngestSegment,
} from '@tornotron/echno-core/document-ingestion/types';

/** One page range a person edits; the page numbers stay text until they are checked. */
export interface RangeDraft {
  docClass: DocClass;
  from: string;
  to: string;
}

/** The page ranges a document was split into, as drafts; none for a workbook's sheets. */
export function draftsOf(
  segments: IngestSegment[],
  fallback: DocClass
): RangeDraft[] {
  return segments
    .filter((s) => s.pageFrom !== undefined && s.pageTo !== undefined)
    .toSorted((a, b) => (a.pageFrom ?? 0) - (b.pageFrom ?? 0))
    .map((s) => ({
      docClass: s.docClass ?? fallback,
      from: String(s.pageFrom),
      to: String(s.pageTo),
    }));
}

/**
 * The ranges to send, or the first problem with them in one sentence: each
 * range from 1 to the page count, first page no later than last, and no two
 * ranges sharing a page.
 */
export function checkRanges(
  drafts: RangeDraft[],
  pageCount: number | undefined
): { ranges: ClassRange[] } | { problem: string } {
  const ranges: ClassRange[] = [];
  for (const [index, draft] of drafts.entries()) {
    const n = index + 1;
    const from = Number(draft.from);
    const to = Number(draft.to);
    if (!Number.isInteger(from) || !Number.isInteger(to)) {
      return { problem: `Range ${n}: enter whole page numbers.` };
    }
    if (from < 1 || to < from) {
      return {
        problem: `Range ${n}: the first page must be 1 or more and no later than the last.`,
      };
    }
    if (pageCount !== undefined && to > pageCount) {
      return {
        problem: `Range ${n}: the file has ${pageCount} pages.`,
      };
    }
    ranges.push({ docClass: draft.docClass, pageFrom: from, pageTo: to });
  }
  const sorted = ranges.toSorted((a, b) => a.pageFrom - b.pageFrom);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].pageFrom <= sorted[i - 1].pageTo) {
      return {
        problem: `Pages ${sorted[i].pageFrom} to ${Math.min(sorted[i].pageTo, sorted[i - 1].pageTo)} are in two ranges.`,
      };
    }
  }
  return { ranges };
}
