/**
 * lib/utils/navigation.ts
 *
 * Utility functions that derive sidebar items, breadcrumb labels, and
 * route metadata from the centralized navigation config.
 *
 * Both the sidebar component and breadcrumbs component import from here
 * instead of maintaining their own duplicate data structures.
 */

import {
  type NavItem,
  navigation,
  segmentLabels,
  hiddenSegments,
  DASHBOARD_BASE,
} from '@/config/nav.config';

// ---------------------------------------------------------------------------
// Flatten
// ---------------------------------------------------------------------------

/**
 * Recursively flatten a `NavItem[]` tree into a single-level array.
 * Useful for lookups and iterations over all items regardless of depth.
 */
export function flattenNavItems(items: NavItem[]): NavItem[] {
  const result: NavItem[] = [];
  for (const item of items) {
    result.push(item);
    if (item.children) {
      result.push(...flattenNavItems(item.children));
    }
  }
  return result;
}

/** Pre-computed flat list of every `NavItem` in the config. */
const allNavItems = flattenNavItems(navigation);

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/**
 * Find the first `NavItem` whose `path` matches exactly.
 */
export function findNavItemByPath(path: string): NavItem | undefined {
  return allNavItems.find((item) => item.path === path);
}

/**
 * Find the first `NavItem` whose `segment` matches.
 * When multiple items share the same segment (e.g. parent/child with the same
 * key), the first match is returned.
 */
export function findNavItemBySegment(segment: string): NavItem | undefined {
  return allNavItems.find((item) => item.segment === segment);
}

// ---------------------------------------------------------------------------
// Breadcrumb helpers
// ---------------------------------------------------------------------------

/**
 * Build a `segment → label` map that mirrors the old `breadcrumbNameMap`.
 * Merges labels from the navigation tree with the standalone `segmentLabels`.
 *
 * Priority: `segmentLabels` > top-level nav items > nested nav items.
 * Top-level items are processed first so that a generic label (e.g. "Settings")
 * is not shadowed by a child with the same segment (e.g. "Attendance Settings").
 */
export function buildBreadcrumbNameMap(): Record<string, string> {
  const map: Record<string, string> = { ...segmentLabels };

  // First pass: top-level items take priority for shared segments
  for (const item of navigation) {
    const label = item.breadcrumb ?? item.label;
    if (!map[item.segment]) {
      map[item.segment] = label;
    }
  }

  // Second pass: fill in any remaining segments from nested items
  for (const item of allNavItems) {
    const label = item.breadcrumb ?? item.label;
    if (!map[item.segment]) {
      map[item.segment] = label;
    }
  }

  return map;
}

/** Pre-computed breadcrumb name map. */
export const breadcrumbNameMap: Record<string, string> =
  buildBreadcrumbNameMap();

/**
 * Resolve a URL segment to its breadcrumb display label.
 *
 * 1. Check the breadcrumb name map (nav tree + segment labels).
 * 2. Fall back to Title Case of the segment string.
 */
export function getBreadcrumbLabel(segment: string): string {
  return (
    breadcrumbNameMap[segment] ??
    segment.charAt(0).toUpperCase() + segment.slice(1)
  );
}

/**
 * Returns `true` if the given segment should be hidden from breadcrumbs.
 */
export function isHiddenSegment(segment: string): boolean {
  return hiddenSegments.has(segment);
}

/**
 * Returns `true` if the given segment should appear in breadcrumbs but
 * NOT be clickable (section headers like Workforce, Resources, etc.).
 */
export function isNonInteractiveSegment(segment: string): boolean {
  const item = findNavItemBySegment(segment);
  return item?.nonInteractive === true;
}

// ---------------------------------------------------------------------------
// Sidebar helpers
// ---------------------------------------------------------------------------

/**
 * Return only the top-level navigation items that should appear in the sidebar.
 * Filters out items with `sidebarHidden: true` and recursively filters children.
 */
export function getSidebarItems(): NavItem[] {
  return filterSidebarItems(navigation);
}

function filterSidebarItems(items: NavItem[]): NavItem[] {
  return items
    .filter((item) => !item.sidebarHidden)
    .map((item) => ({
      ...item,
      children: item.children ? filterSidebarItems(item.children) : undefined,
    }))
    .map((item) => ({
      ...item,
      // Remove empty children arrays
      children:
        item.children && item.children.length > 0 ? item.children : undefined,
    }));
}

// ---------------------------------------------------------------------------
// Active-state helpers
// ---------------------------------------------------------------------------

/**
 * Returns `true` when `currentPath` matches `itemUrl` exactly
 * or is a sub-route (followed by `/`).
 */
export function isPathActive(itemUrl: string, currentPath: string): boolean {
  if (currentPath === itemUrl) return true;
  return currentPath.startsWith(itemUrl + '/');
}

// ---------------------------------------------------------------------------
// ID detection
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the segment looks like a numeric or UUID identifier.
 */
export function isIdSegment(segment: string): boolean {
  return (
    /^\d+$/.test(segment) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      segment
    )
  );
}

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export {
  type NavItem,
  navigation,
  segmentLabels,
  hiddenSegments,
  DASHBOARD_BASE,
} from '@/config/nav.config';

export { nonInteractiveSegments } from '@/config/nav.config';
