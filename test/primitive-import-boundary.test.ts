import { describe, expect, it } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * `components/ui` holds the shadcn CLI primitives and `components/shadcn`
 * holds our extension layer on top of them. For a long time both were
 * imported directly, so two different Buttons and two different Dialogs were
 * live at once and a screen got whichever one its author happened to reach
 * for (#394).
 *
 * The rule is one-way: application code imports `components/shadcn`, and only
 * the extension layer and the vendored registries reach the base primitives.
 * `boundaries/element-types` enforces it in lint. This checks the same thing
 * against the source text, because the lint rule depends on an import
 * resolver and an element-matching `mode`, and it was silently classifying
 * every primitive as an unknown type for months while appearing to be on.
 */

const REPO_ROOT = path.join(import.meta.dir, '..');

/** Directories that legitimately sit on the base layer. */
const ALLOWED_TO_IMPORT_UI = [
  'components/shadcn',
  'components/ui',
  'components/kibo-ui',
  'components/reui',
];

const SEARCHED_ROOTS = [
  'app',
  'components',
  'features',
  'hooks',
  'lib',
  'services',
  'types',
];

const SKIPPED_DIRECTORIES = new Set(['node_modules', '.next', '.git']);

const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

/** Every module specifier in a file: static imports, re-exports, dynamic imports. */
const SPECIFIER =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g;

const UI_DIRECTORY = 'components/ui';

/**
 * Where a specifier points, as a repo-relative path. Matching the raw text is
 * not enough: `components/errors/reload-button.tsx` can write `../ui/button`
 * and land in the base layer without the string `components/ui` appearing
 * anywhere in the file.
 */
function resolveSpecifier(specifier: string, importingFile: string): string {
  if (specifier.startsWith('@/')) {
    return specifier.slice(2);
  }
  if (specifier.startsWith('.')) {
    return path.normalize(path.join(path.dirname(importingFile), specifier));
  }
  return specifier;
}

function importsBaseLayer(
  fileContents: string,
  importingFile: string
): boolean {
  return [...fileContents.matchAll(SPECIFIER)].some((match) => {
    const target = resolveSpecifier(match[1], importingFile);
    return target === UI_DIRECTORY || target.startsWith(`${UI_DIRECTORY}/`);
  });
}

function collectSourceFiles(directory: string, found: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(directory);
  } catch {
    return found;
  }

  for (const entry of entries) {
    if (SKIPPED_DIRECTORIES.has(entry)) continue;
    const fullPath = path.join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      collectSourceFiles(fullPath, found);
    } else if (
      SOURCE_EXTENSIONS.some((extension) => entry.endsWith(extension))
    ) {
      found.push(fullPath);
    }
  }

  return found;
}

describe('primitive import boundary', () => {
  const files = SEARCHED_ROOTS.flatMap((root) =>
    collectSourceFiles(path.join(REPO_ROOT, root))
  ).map((file) => path.relative(REPO_ROOT, file));

  it('finds the source tree', () => {
    // Guards the guard: a broken path walk would make every assertion below
    // pass over an empty list.
    expect(files.length).toBeGreaterThan(500);
  });

  it('leaves components/ui to the extension layer alone', () => {
    const offenders = files
      .filter(
        (file) =>
          !ALLOWED_TO_IMPORT_UI.some((allowed) =>
            file.startsWith(`${allowed}/`)
          )
      )
      .filter((file) =>
        importsBaseLayer(readFileSync(path.join(REPO_ROOT, file), 'utf8'), file)
      );

    expect(offenders).toEqual([]);
  });

  it('keeps every shadcn primitive resolvable', () => {
    // A pass-through shim that names a file `components/ui` no longer has is
    // a build break the migration would otherwise hide.
    const uiFiles = new Set(readdirSync(path.join(REPO_ROOT, 'components/ui')));
    const dangling = readdirSync(path.join(REPO_ROOT, 'components/shadcn'))
      .filter((file) => file.endsWith('.tsx'))
      .flatMap((file) => {
        const source = readFileSync(
          path.join(REPO_ROOT, 'components/shadcn', file),
          'utf8'
        );
        return [...source.matchAll(/'@\/components\/ui\/([a-z0-9-]+)'/g)].map(
          (match) => match[1]
        );
      })
      .filter((name) => !uiFiles.has(`${name}.tsx`));

    expect(dangling).toEqual([]);
  });
});
