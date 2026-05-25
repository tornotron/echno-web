/**
 * scripts/route-utils.ts
 *
 * Shared utilities for the route codegen CLI.
 * Run with: node --experimental-strip-types scripts/generate-routes.ts
 */

// ---------------------------------------------------------------------------
// Types (duplicated here to keep scripts self-contained)
// ---------------------------------------------------------------------------

export interface ScannedRoute {
  id: string;
  segment: string;
  path: string;
  isDynamic: boolean;
  isCatchAll: boolean;
  paramName?: string;
  children: ScannedRoute[];
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

/**
 * Convert an array of path segments (relative to the dashboard root)
 * into a stable route ID.
 *
 * Examples:
 *   ['finance', 'receipts']     → 'finance-receipts'
 *   ['projects', '[id]', 'tasks'] → 'projects-[id]-tasks'
 *   []                           → 'dashboard'
 */
export function segmentsToId(segments: string[]): string {
  if (segments.length === 0) return 'dashboard';
  return segments.join('-');
}

// ---------------------------------------------------------------------------
// Segment classification
// ---------------------------------------------------------------------------

export function isDynamic(segment: string): boolean {
  return (
    segment.startsWith('[') &&
    segment.endsWith(']') &&
    !segment.startsWith('[...')
  );
}

export function isCatchAll(segment: string): boolean {
  return segment.startsWith('[...') && segment.endsWith(']');
}

export function extractParamName(segment: string): string | undefined {
  if (isDynamic(segment)) return segment.slice(1, -1);
  if (isCatchAll(segment)) return segment.slice(4, -1);
  return undefined;
}

// ---------------------------------------------------------------------------
// Route helper key for dynamic segments
// ---------------------------------------------------------------------------

const DETAIL_PARAMS = new Set([
  'id',
  'roomId',
  'taskId',
  'issueId',
  'budgetId',
  'orderId',
]);

/**
 * Returns the camelCase key used for a dynamic segment in the route helpers.
 * 'id' and common ID params map to 'detail'.
 */
export function dynamicKey(paramName: string): string {
  if (DETAIL_PARAMS.has(paramName)) return 'detail';
  return paramName;
}

/**
 * Convert a kebab-case segment to camelCase for use as a JS object key.
 */
export function toCamelCase(str: string): string {
  return str.replaceAll(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Code generation helpers
// ---------------------------------------------------------------------------

/** Indent a multiline string by `depth` levels (2 spaces each). */
export function indent(str: string, depth: number): string {
  const pad = '  '.repeat(depth);
  return str
    .split('\n')
    .map((line) => (line.trim() ? pad + line : line))
    .join('\n');
}

/** Render a RouteNode as a TypeScript object literal string. */
export function renderRouteNode(node: ScannedRoute, depth = 1): string {
  const paramLine = node.paramName ? `\n  paramName: '${node.paramName}',` : '';
  const childrenStr =
    node.children.length === 0
      ? '[]'
      : `[\n${node.children.map((c) => indent(renderRouteNode(c, depth + 1), depth + 1)).join(',\n')},\n${'  '.repeat(depth)}]`;

  return `{
  id: '${node.id}',
  segment: '${node.segment}',
  path: '${node.path}',
  isDynamic: ${node.isDynamic},
  isCatchAll: ${node.isCatchAll},${paramLine}
  children: ${childrenStr},
}`;
}

/**
 * Render the route helpers object for a set of child routes under a given path prefix.
 * Returns a TypeScript object literal (without the outer braces).
 */
export function renderHelperChildren(
  routes: ScannedRoute[],
  pathPrefix: string,
  depth = 1
): string {
  const lines: string[] = [];

  for (const route of routes) {
    if (route.isCatchAll) continue; // catch-alls are edge cases, skip for now

    const key = route.isDynamic
      ? dynamicKey(route.paramName ?? route.segment)
      : toCamelCase(route.segment);

    if (route.isDynamic) {
      const param = route.paramName ?? 'id';
      // Dynamic routes become functions
      if (route.children.length === 0) {
        lines.push(
          `${key}: (${param}: string | number) => ({\n  href: \`${pathPrefix}/\${${param}}\`,\n})`
        );
      } else {
        const innerChildren = renderHelperChildren(
          route.children,
          `${pathPrefix}/\${${param}}`,
          depth + 1
        );
        lines.push(
          `${key}: (${param}: string | number) => ({\n  href: \`${pathPrefix}/\${${param}}\`,\n${innerChildren}\n})`
        );
      }
    } else if (route.children.length === 0) {
      // Static leaf — just a string
      lines.push(`${key}: b('${route.path.replace('/users/dashboard', '')}')`);
    } else {
      // Static non-leaf — object with href + children
      const innerChildren = renderHelperChildren(
        route.children,
        route.path.replace('/users/dashboard', ''),
        depth + 1
      );
      lines.push(
        `${key}: {\n  href: b('${route.path.replace('/users/dashboard', '')}'),\n${innerChildren}\n}`
      );
    }
  }

  return lines.join(',\n');
}

// ---------------------------------------------------------------------------
// File header
// ---------------------------------------------------------------------------

export function generatedHeader(filename: string, date: string): string {
  return `/**
 * ${filename}
 *
 * AUTO-GENERATED — do not edit by hand.
 * Run \`bun routes:generate\` to regenerate from the filesystem.
 *
 * Source: app/users/dashboard (scanned recursively)
 * Generated: ${date}
 */
`;
}
