import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * A document's `*By` stamps are user ids the backend writes from the session.
 * For a while nothing could turn one into a name, so the screens rendered
 * `User #<id>` and built the string themselves. The backend resolves them now
 * and sends the name beside the id, so the string belongs in exactly one place:
 * `lib/utils/user-reference.ts`, which owns the fallback for the two stamps
 * that still arrive as a bare id.
 *
 * This guards the two mistakes that would quietly undo the change. Rebuilding
 * the placeholder in a screen strands that screen on the id even though the
 * name is right there on the document. Reaching back to the employee lookup for
 * a user id is worse: the two tables run separate sequences, so it misses for
 * most ids and names a person who never touched the document.
 */
const SEARCH_ROOTS = [
  'app',
  'features',
  'hooks',
  'services',
  'components',
  'lib',
];

/** The module that owns the reference string and is allowed to build it. */
const OWNER = path.join('lib', 'utils', 'user-reference.ts');
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

const sources = SEARCH_ROOTS.flatMap((root) => sourceFilesUnder(root)).filter(
  (file) => file !== OWNER
);

describe('the User #<id> placeholder lives in one module', () => {
  test('no screen builds the reference string itself', () => {
    const offenders = sources.filter((file) => {
      const source = readFileSync(file, 'utf8');
      // Both spellings: the template literal it was written as, and the
      // concatenation somebody would reach for after the first is blocked.
      return source.includes('`User #${') || source.includes("'User #' +");
    });
    expect(offenders).toEqual([]);
  });
});

/**
 * The stamps each detail screen shows, and the `*ByName` field the backend
 * resolves for it. A screen that renders a stamp has to read the name.
 */
const STAMP_SCREENS: { file: string; stamps: string[] }[] = [
  {
    file: 'app/users/dashboard/finance/invoices/[id]/page.tsx',
    stamps: ['submittedBy', 'approvedBy', 'paymentRecordedBy'],
  },
  {
    file: 'app/users/dashboard/resources/stock-adjustments/[id]/page.tsx',
    stamps: ['submittedBy', 'approvedBy', 'rejectedBy'],
  },
];

describe('stamp screens read the resolved name', () => {
  for (const { file, stamps } of STAMP_SCREENS) {
    for (const stamp of stamps) {
      test(`${path.basename(path.dirname(path.dirname(file)))} labels ${stamp} from ${stamp}Name`, () => {
        const source = readFileSync(file, 'utf8');
        expect(source).toContain(`${stamp}Name`);
        expect(source.includes(`userReferenceLabel(invoice.${stamp})`)).toBe(
          false
        );
        expect(source.includes(`userReferenceLabel(adjustment.${stamp})`)).toBe(
          false
        );
      });
    }
  }
});

/**
 * `physicalCountBy` on a stock adjustment holds an **employee** id taken from
 * the creation payload, not a session stamp. It has no `*ByName` on the wire
 * and must never grow one: naming it out of the user directory would put the
 * original wrong-name bug back, pointed the other way.
 */
describe('the employee-keyed count stamp stays employee-keyed', () => {
  test('nothing invents a user-directory name for physicalCountBy', () => {
    const offenders = sources.filter((file) =>
      readFileSync(file, 'utf8').includes('physicalCountByName')
    );
    expect(offenders).toEqual([]);
  });
});
