import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * Site transfers, purchase orders and GRNs have no delete endpoint. The backend
 * never had one, and `echno-core` marks the three mutations `@deprecated` and
 * replaces the request with a `throw`, so anything wired to them fails on click
 * with an error toast rather than deleting anything.
 *
 * All three had a Delete button on their detail page regardless. This guards
 * against one being added back: the hooks are still exported from `echno-core`
 * and still autocomplete, so the mistake is easy to repeat.
 *
 * Deleting these documents is not the operation we want anyway. Each one posts
 * inventory ledger rows when it is created, and removing the document would
 * leave the stock movements behind. The correction is a reversal that writes
 * paired rows, which is a separate design.
 */
const DEAD_DELETE_HOOKS = [
  'useDeleteSiteTransfer',
  'useDeletePurchaseOrder',
  'useDeleteGRN',
];

const SEARCH_ROOTS = ['app', 'features'];
const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

function sourceFilesUnder(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const entryPath = path.join(dir, entry);
    if (statSync(entryPath).isDirectory()) {
      found.push(...sourceFilesUnder(entryPath));
      continue;
    }
    if (entryPath.endsWith('.test.ts') || entryPath.endsWith('.test.tsx'))
      continue;
    if (SOURCE_EXTENSIONS.some((ext) => entryPath.endsWith(ext)))
      found.push(entryPath);
  }
  return found;
}

describe('delete actions the backend cannot serve', () => {
  const files = SEARCH_ROOTS.flatMap((root) => sourceFilesUnder(root));

  test('the search actually covers the pages that had the buttons', () => {
    // Without this, a broken walk would make the real assertion below pass by
    // finding nothing at all.
    expect(files).toContain(
      'app/users/dashboard/resources/transfers/[id]/page.tsx'
    );
    expect(files).toContain(
      'app/users/dashboard/resources/purchase-orders/[id]/page.tsx'
    );
    expect(files).toContain(
      'app/users/dashboard/resources/goods-receipts/[id]/page.tsx'
    );
  });

  test.each(DEAD_DELETE_HOOKS)('nothing calls %s', (hook) => {
    const callers = files.filter((file) =>
      readFileSync(file, 'utf8').includes(hook)
    );
    expect(callers).toEqual([]);
  });
});
