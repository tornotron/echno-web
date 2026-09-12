/**
 * The local leave client is gone (#412). The leave surface reads types, query
 * keys, query hooks and the service from `@tornotron/echno-core`; the only
 * web-side leave modules left are the role adapter, the toast-carrying
 * mutation layer and the quota join.
 */

import { describe, expect, it } from 'bun:test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.join(import.meta.dir, '..');

const DELETED = [
  'services/leave-service.ts',
  'services/leave-service.test.ts',
  'hooks/leave/use-leave.ts',
  'hooks/leave/use-approvals-for-approver.ts',
  'types/leave',
];

const RETIRED_SPECIFIERS = [
  '@/services/leave-service',
  '@/types/leave',
  '@/hooks/leave/use-leave',
  '@/hooks/leave/use-approvals-for-approver',
];

const SEARCHED_ROOTS = [
  'app',
  'components',
  'features',
  'hooks',
  'lib',
  'services',
  'test',
  'types',
];
const SKIPPED = new Set(['node_modules', '.next', '.git']);

function sourceFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (SKIPPED.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

function importsOf(source: string): string[] {
  const out: string[] = [];
  const re =
    /from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|mock\.module\(\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

describe('the local leave client is deleted', () => {
  for (const rel of DELETED) {
    it(`${rel} no longer exists`, () => {
      expect(existsSync(path.join(REPO_ROOT, rel))).toBe(false);
    });
  }

  it('nothing imports the deleted modules', () => {
    const offenders: string[] = [];
    for (const root of SEARCHED_ROOTS) {
      for (const file of sourceFiles(path.join(REPO_ROOT, root))) {
        const source = readFileSync(file, 'utf8');
        for (const spec of importsOf(source)) {
          const retired = RETIRED_SPECIFIERS.some(
            (r) => spec === r || spec.startsWith(`${r}/`)
          );
          if (retired)
            offenders.push(`${path.relative(REPO_ROOT, file)} -> ${spec}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the role adapter reads LeaveRole from its new home', () => {
    const source = readFileSync(
      path.join(REPO_ROOT, 'hooks/leave/use-leave-role.ts'),
      'utf8'
    );
    expect(source.includes("from '@/features/leave/lib/leave-role'")).toBe(
      true
    );
    expect(
      existsSync(path.join(REPO_ROOT, 'features/leave/lib/leave-role.ts'))
    ).toBe(true);
  });
});
