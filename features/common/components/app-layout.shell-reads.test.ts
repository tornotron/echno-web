import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The application shell wraps every authenticated route, so anything it reads is read on every
 * navigation. It used to read three whole collections there to seed a command palette that is
 * closed on almost all of them, and a fourth through the breadcrumb hook.
 *
 * This is asserted against the source rather than by rendering, on purpose. The property is about
 * where a call lives, not what it returns: the palette's own test already covers the behaviour, and
 * the failure this guards against is someone reaching for a convenient `useX()` in the shell again.
 * Rendering the shell would need the session, organization, sidebar and router providers mocked
 * around it, which is a lot of machinery to assert a one-line fact.
 */

const shellFiles = {
  'app-layout.tsx': path.join(import.meta.dir, 'app-layout.tsx'),
  'use-breadcrumb-data.ts': path.join(import.meta.dir, '../../../hooks/use-breadcrumb-data.ts'),
};

/** Hooks that read an entire collection. None of them belongs on a per-route render path. */
const wholeCollectionHooks = [
  'useProjects',
  'useTasks',
  'useIssues',
  'useEmployees',
];

describe('the application shell reads nothing collection-sized', () => {
  for (const [name, path] of Object.entries(shellFiles)) {
    for (const hook of wholeCollectionHooks) {
      test(`${name} does not call ${hook}()`, () => {
        const source = readFileSync(path, 'utf8');
        expect(source).not.toInclude(`${hook}()`);
      });
    }
  }

  test('the breadcrumb hook resolves its names one id at a time', () => {
    const source = readFileSync(shellFiles['use-breadcrumb-data.ts'], 'utf8');
    expect(source).toInclude('useEmployee(');
    expect(source).toInclude('useProject(');
  });
});
