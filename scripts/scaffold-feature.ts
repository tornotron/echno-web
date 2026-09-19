/**
 * Scaffolds a module feature in this app: the module contract, a list and a
 * form component on the core hooks, the guarded route segment, the nav
 * metadata entry, and a test per surface.
 *
 *   bun run scaffold:feature <id> ["<Name>"] [--core-stub]
 *   bun run scaffold:feature toolbox-talks "Toolbox Talks"
 *
 * `<id>` is the module id from the backend manifest (`[a-z][a-z0-9-]*`); the
 * components import `@tornotron/echno-core/<id>/hooks`, which is what the
 * core scaffold (`bun run scaffold:domain <id>`) publishes. `<Name>` is the
 * display name; it defaults to the id in title case.
 *
 * Writes `features/<id>/`, `app/users/dashboard/<id>/`,
 * `nav/metadata/<id>.meta.ts`, registers the metadata in
 * `nav/metadata/index.ts`, adds and grants `<id>:read` in
 * `nav/access/roles.ts`, and regenerates the route tables.
 *
 * `--core-stub` also renders type stand-ins for the core subpath into
 * `scripts/scaffold/.stub/<id>/` (gitignored). The `scaffold-check` CI job
 * uses it for `ci-probe`, whose core subpath is never published, and
 * typechecks with `tsconfig.scaffold-check.json`.
 *
 * Templates live in `scripts/scaffold/templates/`, plain files with
 * `__MODULE_ID__`, `__MODULE_PASCAL__`, `__MODULE_CAMEL__`, `__MODULE_NAME__`
 * and `__FEATURE_KEY__` placeholders. The generator refuses an id that fails
 * the pattern or already exists.
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAFFOLD = path.join(ROOT, 'scripts', 'scaffold');
const TEMPLATES = path.join(SCAFFOLD, 'templates');
const CORE_STUB = path.join(SCAFFOLD, 'core-stub');
const METADATA_INDEX = path.join(ROOT, 'nav', 'metadata', 'index.ts');
const ROLES = path.join(ROOT, 'nav', 'access', 'roles.ts');

export const ID_PATTERN = /^[a-z][a-z0-9-]*$/;

export function pascalOf(id: string): string {
  return id
    .split('-')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
}

export function camelOf(id: string): string {
  const pascal = pascalOf(id);
  return pascal[0].toLowerCase() + pascal.slice(1);
}

export function featureKeyOf(id: string): string {
  return `MODULE_${id.toUpperCase().replaceAll('-', '_')}`;
}

export function nameOf(id: string): string {
  return id
    .split('-')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

export interface ScaffoldPlan {
  id: string;
  name: string;
  files: Array<{ path: string; content: string }>;
  metadataIndex: string;
  roles: string;
}

function render(template: string, id: string, name: string): string {
  return template
    .replaceAll('__MODULE_ID__', id)
    .replaceAll('__MODULE_PASCAL__', pascalOf(id))
    .replaceAll('__MODULE_CAMEL__', camelOf(id))
    .replaceAll('__MODULE_NAME__', name)
    .replaceAll('__FEATURE_KEY__', featureKeyOf(id));
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out.toSorted();
}

export function existingPathsFor(id: string): string[] {
  return [
    path.join('features', id),
    path.join('app', 'users', 'dashboard', id),
    path.join('nav', 'metadata', `${id}.meta.ts`),
  ].filter((rel) => fs.existsSync(path.join(ROOT, rel)));
}

/** Inserts `line` after the last match of `pattern`, which must match at least once. */
function afterLast(source: string, pattern: RegExp, line: string): string {
  let last: RegExpExecArray | undefined;
  for (const match of source.matchAll(pattern)) last = match;
  if (!last) throw new Error(`no match for ${pattern}`);
  const at = last.index + last[0].length;
  return `${source.slice(0, at)}\n${line}${source.slice(at)}`;
}

/**
 * Registers `<camel>Metadata` in nav/metadata/index.ts: an import after the
 * last `.meta` import, an entry at the end of the `validateMetadataModules({`
 * object, and a re-export after the last `.meta` re-export. Anchored on the
 * file's shape rather than on any one module, so it works however many
 * modules were registered before.
 */
export function registerMetadata(index: string, id: string): string {
  const camel = camelOf(id);
  const importLine = `import { ${camel}Metadata } from './${id}.meta';`;
  const exportLine = `export { ${camel}Metadata } from './${id}.meta';`;
  const lastImport = /^import \{ \w+ \} from '\.\/[\w-]+\.meta';$/gm;
  const lastExport = /^export \{ \w+ \} from '\.\/[\w-]+\.meta';$/gm;
  const registry = /(validateMetadataModules\(\{[\s\S]*?)(\n\}\);)/;
  if (!lastImport.test(index) || !lastExport.test(index) || !registry.test(index)) {
    throw new Error('nav/metadata/index.ts no longer has the anchor shape this generator expects');
  }
  let out = afterLast(index, lastImport, importLine);
  out = out.replace(registry, `$1\n  ${camel}Metadata,$2`);
  return afterLast(out, lastExport, exportLine);
}

/**
 * Adds `<id>:read` to the `Permission` union in nav/access/roles.ts and grants
 * it to every role in `ROLE_PERMISSIONS`. The union is closed, so without
 * this the metadata entry does not typecheck; the grant is what the nav's
 * permission check reads, and the real gate for a module is its `moduleId`
 * (see the comment above `ROLE_PERMISSIONS`).
 */
export function registerPermission(roles: string, id: string): string {
  const permission = `${id}:read`;
  const union = /(export type Permission =(?:\n  \| '[^']+')+)(;)/;
  const grants = /^(\s+(?:admin|manager|employee): \[)([^\]]*)(\],)$/gm;
  if (!union.test(roles) || (roles.match(grants) ?? []).length !== 3) {
    throw new Error('nav/access/roles.ts no longer has the anchor shape this generator expects');
  }
  return roles
    .replace(union, `$1\n  | '${permission}'$2`)
    .replaceAll(grants, (_m, open: string, list: string, close: string) => {
      const trimmed = list.trimEnd();
      const sep = trimmed === '' ? '' : trimmed.endsWith(',') ? ' ' : ', ';
      return `${open}${trimmed}${sep}'${permission}'${close}`;
    });
}

export function plan(id: string, name: string, coreStub = false): ScaffoldPlan {
  if (!ID_PATTERN.test(id)) {
    throw new Error(`id "${id}" must match ${ID_PATTERN} (the backend manifest pattern)`);
  }
  const taken = existingPathsFor(id);
  if (taken.length > 0) {
    throw new Error(`id "${id}" already exists: ${taken.join(', ')}`);
  }

  const files: ScaffoldPlan['files'] = [];
  for (const file of walk(TEMPLATES)) {
    const rel = path.relative(TEMPLATES, file).replace(/\.tmpl$/, '');
    files.push({ path: render(rel, id, name), content: render(fs.readFileSync(file, 'utf8'), id, name) });
  }
  if (coreStub) {
    for (const file of walk(CORE_STUB)) {
      const rel = path.relative(CORE_STUB, file).replace(/\.tmpl$/, '');
      files.push({
        path: path.join('scripts', 'scaffold', '.stub', id, rel),
        content: render(fs.readFileSync(file, 'utf8'), id, name),
      });
    }
  }
  const metadataIndex = registerMetadata(fs.readFileSync(METADATA_INDEX, 'utf8'), id);
  const roles = registerPermission(fs.readFileSync(ROLES, 'utf8'), id);
  return { id, name, files, metadataIndex, roles };
}

export function apply(p: ScaffoldPlan): void {
  for (const file of p.files) {
    const full = path.join(ROOT, file.path);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, file.content);
  }
  fs.writeFileSync(METADATA_INDEX, p.metadataIndex);
  fs.writeFileSync(ROLES, p.roles);
}

function regenerateRoutes(): void {
  const result = spawnSync(
    'node',
    ['--experimental-strip-types', 'scripts/generate-routes.ts'],
    { cwd: ROOT, stdio: 'inherit' }
  );
  if (result.status !== 0) throw new Error('routes:generate failed');
}

function main(argv: string[]): void {
  const coreStub = argv.includes('--core-stub');
  const [id, nameArg] = argv.filter((arg) => !arg.startsWith('--'));
  if (!id) {
    throw new Error('usage: bun run scaffold:feature <id> ["<Name>"] [--core-stub]');
  }
  const p = plan(id, nameArg ?? nameOf(id), coreStub);
  apply(p);
  regenerateRoutes();
  console.log(`Scaffolded feature "${p.id}" (${p.name}, ${featureKeyOf(p.id)}):`);
  for (const file of p.files) console.log(`  ${file.path}`);
  console.log('  nav/metadata/index.ts (registered)');
  console.log(`  nav/access/roles.ts (${p.id}:read added and granted)`);
  console.log('  nav/generated/* (routes regenerated)');
  console.log('');
  console.log('Next:');
  console.log(`  bun add @tornotron/echno-core@<version that publishes ${p.id}/hooks>`);
  console.log(`  bunx tsc --noEmit && bun run lint && bun test features/${p.id}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
