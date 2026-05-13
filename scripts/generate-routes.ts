#!/usr/bin/env node
/**
 * scripts/generate-routes.ts
 *
 * Filesystem-driven route codegen CLI.
 *
 * Usage:
 *   pnpm routes:generate          — generate once
 *   pnpm routes:watch             — watch and regenerate on changes
 *
 * Requires Node.js 22+ (uses --experimental-strip-types).
 * Run via: node --experimental-strip-types scripts/generate-routes.ts
 *
 * What it generates:
 *   nav/generated/routes.generated.ts        — RouteNode tree
 *   nav/generated/route-helpers.generated.ts — typed route builder API
 *   nav/generated/route-index.generated.ts   — precomputed lookup maps
 */

import * as fs from 'node:fs';
import path from 'node:path';
import {
  type ScannedRoute,
  segmentsToId,
  isDynamic,
  isCatchAll,
  extractParamName,
  toCamelCase,
  dynamicKey,
  renderRouteNode,
  generatedHeader,
} from './route-utils.ts';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT_DIR = path.resolve(process.cwd(), 'app/users/dashboard');
const OUT_DIR = path.resolve(process.cwd(), 'nav/generated');
const DASHBOARD_BASE = '/users/dashboard';

/** Folder names to ignore entirely. */
const IGNORED_FOLDERS = new Set([
  'api',
  '_components',
  '_hooks',
  '_utils',
  '_lib',
  '_actions',
]);

// ---------------------------------------------------------------------------
// Filesystem scanner
// ---------------------------------------------------------------------------

function shouldIgnore(name: string): boolean {
  if (IGNORED_FOLDERS.has(name)) return true;
  if (name.startsWith('_')) return true;
  return false;
}

function isRouteGroup(name: string): boolean {
  return name.startsWith('(') && name.endsWith(')');
}

function scanDirectory(
  dir: string,
  relativeSegments: string[]
): ScannedRoute[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const routes: ScannedRoute[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;

    if (shouldIgnore(name)) continue;

    if (isRouteGroup(name)) {
      // Route groups are transparent — recurse without adding a segment
      const groupRoutes = scanDirectory(path.join(dir, name), relativeSegments);
      routes.push(...groupRoutes);
      continue;
    }

    const childSegments = [...relativeSegments, name];
    const id = segmentsToId(childSegments);
    const routePath = `${DASHBOARD_BASE}/${childSegments.join('/')}`;
    const dynamic = isDynamic(name);
    const catchAll = isCatchAll(name);
    const paramName = extractParamName(name);

    const children = scanDirectory(path.join(dir, name), childSegments);

    routes.push({
      id,
      segment: name,
      path: routePath,
      isDynamic: dynamic,
      isCatchAll: catchAll,
      paramName,
      children: sortRoutes(children),
    });
  }

  return routes;
}

/** Sort: static before dynamic, alphabetical within each group. */
function sortRoutes(routes: ScannedRoute[]): ScannedRoute[] {
  return [...routes].toSorted((a, b) => {
    if (a.isDynamic !== b.isDynamic) return a.isDynamic ? 1 : -1;
    return a.segment.localeCompare(b.segment);
  });
}

// ---------------------------------------------------------------------------
// Code generators
// ---------------------------------------------------------------------------

function generateRoutesFile(routes: ScannedRoute[], date: string): string {
  const rootNode: ScannedRoute = {
    id: 'dashboard',
    segment: 'dashboard',
    path: DASHBOARD_BASE,
    isDynamic: false,
    isCatchAll: false,
    children: routes,
  };

  return `${generatedHeader('nav/generated/routes.generated.ts', date)}
import type { RouteNode } from '../types';

export const ROUTE_TREE: RouteNode = ${renderRouteNode(rootNode, 0)};

function flattenTree(node: RouteNode): RouteNode[] {
  return [node, ...node.children.flatMap((child) => flattenTree(child))];
}

export const ALL_ROUTE_NODES: readonly RouteNode[] = flattenTree(ROUTE_TREE);
`;
}

// ---------------------------------------------------------------------------
// Helper generator — clean recursive approach
// ---------------------------------------------------------------------------

interface CapturedParam {
  paramName: string;
  variable: string;
}

/**
 * Resolves `[paramName]` placeholders in a relative path using captured params.
 * Returns the path as a string ready to embed in generated code.
 * When params are captured, the result contains ${variable} template literal syntax.
 */
function resolvePathTemplate(
  relPath: string,
  captured: CapturedParam[]
): string {
  let resolved = relPath;
  for (const { paramName, variable } of captured) {
    // `\${variable}` produces the literal string "${variable}" in the output
    resolved = resolved.replace(`[${paramName}]`, `\${${variable}}`);
  }
  return resolved;
}

/**
 * Produces the b() call expression for a given path and captured params.
 * Uses template literal backticks when any param substitution is present.
 */
function pathCallExpr(rawPath: string, captured: CapturedParam[]): string {
  const rel = rawPath.replace(DASHBOARD_BASE, '');
  const resolved = resolvePathTemplate(rel, captured);
  const needsTemplate = captured.some(({ paramName }) =>
    rel.includes(`[${paramName}]`)
  );
  return needsTemplate ? `b(\`${resolved}\`)` : `b('${resolved}')`;
}

/**
 * Recursively renders child route entries as key-value pairs.
 * Returns an array of "  key: value" strings (no leading/trailing braces).
 */
function renderHelperEntries(
  routes: ScannedRoute[],
  captured: CapturedParam[],
  indentLevel: number
): string[] {
  const pad = '  '.repeat(indentLevel);
  const innerPad = '  '.repeat(indentLevel + 1);
  const entries: string[] = [];

  for (const route of routes) {
    if (route.isCatchAll) continue;

    const key = route.isDynamic
      ? dynamicKey(route.paramName ?? 'id')
      : toCamelCase(route.segment);

    if (route.isDynamic) {
      const param = route.paramName ?? 'id';
      const newCaptured: CapturedParam[] = [
        ...captured,
        { paramName: param, variable: param },
      ];
      const hrefExpr = pathCallExpr(route.path, newCaptured);

      if (route.children.length === 0) {
        entries.push(
          `${pad}${key}: (${param}: string | number) => ({ href: ${hrefExpr} })`
        );
      } else {
        const childEntries = renderHelperEntries(
          route.children,
          newCaptured,
          indentLevel + 1
        );
        entries.push(
          `${pad}${key}: (${param}: string | number) => ({\n` +
            `${innerPad}href: ${hrefExpr},\n` +
            `${childEntries.join(',\n')},\n` +
            `${pad}})`
        );
      }
    } else {
      const hrefExpr = pathCallExpr(route.path, captured);

      if (route.children.length === 0) {
        entries.push(`${pad}${key}: ${hrefExpr}`);
      } else {
        const childEntries = renderHelperEntries(
          route.children,
          captured,
          indentLevel + 1
        );
        entries.push(
          `${pad}${key}: {\n` +
            `${innerPad}href: ${hrefExpr},\n` +
            `${childEntries.join(',\n')},\n` +
            `${pad}}`
        );
      }
    }
  }

  return entries;
}

function generateHelpersFile(routes: ScannedRoute[], date: string): string {
  const topLevelEntries = renderHelperEntries(routes, [], 1);

  return `${generatedHeader('nav/generated/route-helpers.generated.ts', date)}
const BASE = '${DASHBOARD_BASE}';
const b = (path: string) => \`\${BASE}\${path}\`;

export const routes = {
  href: b(''),

${topLevelEntries.join(',\n\n')},
} as const;

export type Routes = typeof routes;
`;
}

function generateIndexFile(date: string): string {
  return `${generatedHeader('nav/generated/route-index.generated.ts', date)}
import type { RouteNode } from '../types';
import { ROUTE_TREE, ALL_ROUTE_NODES } from './routes.generated';

export const routeById: Readonly<Record<string, RouteNode>> = Object.fromEntries(
  ALL_ROUTE_NODES.map((node) => [node.id, node])
);

export const routeByPath: Readonly<Record<string, RouteNode>> = Object.fromEntries(
  ALL_ROUTE_NODES.map((node) => [node.path, node])
);

const _segmentMap: Record<string, RouteNode[]> = {};
for (const node of ALL_ROUTE_NODES) {
  if (_segmentMap[node.segment]) {
    _segmentMap[node.segment].push(node);
  } else {
    _segmentMap[node.segment] = [node];
  }
}
export const routesBySegment: Readonly<Record<string, RouteNode[]>> = _segmentMap;

function buildParentMap(node: RouteNode, map: Map<string, RouteNode[]>): void {
  map.set(node.id, node.children);
  for (const child of node.children) buildParentMap(child, map);
}

const _parentMap = new Map<string, RouteNode[]>();
buildParentMap(ROUTE_TREE, _parentMap);
export const childrenById: Readonly<Map<string, RouteNode[]>> = _parentMap;

export const allRouteIds: readonly string[] = ALL_ROUTE_NODES.map((n) => n.id);
export const allStaticPaths: readonly string[] = ALL_ROUTE_NODES.filter((n) => !n.isDynamic).map((n) => n.path);
export const allDynamicRouteNodes: readonly RouteNode[] = ALL_ROUTE_NODES.filter((n) => n.isDynamic);
`;
}

// ---------------------------------------------------------------------------
// Writer
// ---------------------------------------------------------------------------

function writeIfChanged(filePath: string, content: string): boolean {
  try {
    const existing = fs.readFileSync(filePath, 'utf8');
    // Strip date line for comparison (so regenerating the same structure = no write)
    const normalize = (s: string) =>
      s.replace(/\* Generated: .+/, '* Generated: [normalized]');
    if (normalize(existing) === normalize(content)) return false;
  } catch {
    // File doesn't exist yet
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function countRoutes(routes: ScannedRoute[]): number {
  let total = 0;
  for (const r of routes) {
    total += 1 + countRoutes(r.children);
  }
  return total;
}

function generate(): void {
  const date = new Date().toISOString().split('T')[0];
  console.log(`[routes:generate] Scanning ${ROOT_DIR}...`);

  if (!fs.existsSync(ROOT_DIR)) {
    console.error(`[routes:generate] ERROR: Directory not found: ${ROOT_DIR}`);
    process.exit(1);
  }

  const scanned = sortRoutes(scanDirectory(ROOT_DIR, []));
  const totalRoutes = countRoutes(scanned);
  console.log(`[routes:generate] Found ${totalRoutes} route nodes.`);

  const files: Array<{ name: string; path: string; content: string }> = [
    {
      name: 'routes.generated.ts',
      path: path.join(OUT_DIR, 'routes.generated.ts'),
      content: generateRoutesFile(scanned, date),
    },
    {
      name: 'route-helpers.generated.ts',
      path: path.join(OUT_DIR, 'route-helpers.generated.ts'),
      content: generateHelpersFile(scanned, date),
    },
    {
      name: 'route-index.generated.ts',
      path: path.join(OUT_DIR, 'route-index.generated.ts'),
      content: generateIndexFile(date),
    },
  ];

  for (const file of files) {
    const changed = writeIfChanged(file.path, file.content);
    console.log(
      `[routes:generate] ${changed ? '✓ updated' : '— unchanged'} ${file.name}`
    );
  }

  console.log('[routes:generate] Done.');
}

// ---------------------------------------------------------------------------
// Watch mode
// ---------------------------------------------------------------------------

function watch(): void {
  console.log(`[routes:watch] Watching ${ROOT_DIR} for changes...`);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  generate();

  fs.watch(ROOT_DIR, { recursive: true }, (event, filename) => {
    if (!filename) return;

    // Only regenerate on directory-level changes
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(`[routes:watch] Change detected: ${filename}`);
      generate();
    }, 200);
  });
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

if (process.argv.includes('--watch')) {
  watch();
} else {
  generate();
}
