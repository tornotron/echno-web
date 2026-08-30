/**
 * Keeps the pager on a page that exists.
 *
 * The page a user is on can stop existing under them: settling the last open
 * payable on the final page of a listing filtered to outstanding removes the
 * row that made that page, and the refetch then asks for a page index past the
 * end. The result is an empty table under a footer reading "page 3 of 2".
 *
 * Clamping to the last page rather than resetting to the first keeps the user
 * where they were looking, which after a decision on a long list is usually the
 * end of it.
 *
 * @param pageNo - The zero-based page currently requested.
 * @param totalPages - How many pages the last response said there are.
 * @returns The page to request.
 */
export function clampPageNo(pageNo: number, totalPages: number): number {
  if (totalPages <= 0) return 0;
  if (pageNo >= totalPages) return totalPages - 1;
  return Math.max(0, pageNo);
}
