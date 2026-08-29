import { describe, expect, test } from 'bun:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { inspectionService } from './inspection-service';

/**
 * The retired path as a call site would have to spell it: inside a string
 * literal. Prose that names the endpoint, here or in the doc comment that
 * explains why it went, is not a caller.
 */
const SYNCHRONOUS_ENDPOINT =
  /['"`][^'"`]*inspections\/web\/compliance\/regenerate/;

const SOURCE_ROOTS = [
  'app',
  'components',
  'features',
  'hooks',
  'lib',
  'services',
  'types',
];

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const entryPath = path.join(dir, entry);
    if (statSync(entryPath).isDirectory()) {
      found.push(...sourceFiles(entryPath));
    } else if (/\.tsx?$/.test(entry)) {
      found.push(entryPath);
    }
  }
  return found;
}

// The synchronous compliance endpoint is gone from this client. It still exists
// on the backend, deprecated, only so that nothing broke while this moved, and
// it is deleted once this lands. A caller re-added here would bring back the
// timeouts it was retired for, so the retirement is asserted rather than
// assumed.
describe('the synchronous compliance call is retired', () => {
  test('the inspection service no longer offers it', () => {
    expect('regenerateCompliance' in inspectionService).toBe(false);
  });

  test('nothing in the app calls the regenerate endpoint any more', () => {
    const offenders = SOURCE_ROOTS.flatMap((root) => sourceFiles(root)).filter(
      (file) =>
        !/\.test\.tsx?$/.test(file) &&
        SYNCHRONOUS_ENDPOINT.test(readFileSync(file, 'utf8'))
    );

    expect(offenders).toEqual([]);
  });
});
