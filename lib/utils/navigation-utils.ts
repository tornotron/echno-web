/**
 * lib/utils/navigation-utils.ts
 *
 * Navigation utility functions.
 * Re-exports from the nav/ platform so existing consumers continue to work.
 *
 * Consumers may migrate to '@/nav' directly when convenient.
 */

import { flattenComposedNav, buildBreadcrumbLabelIndex } from '@/nav/indexes';
import { navigation, hiddenSegments as _hiddenSegments } from '@/nav';
import type { NavItem } from '@/nav/types';

// ---------------------------------------------------------------------------
// Flatten
// ---------------------------------------------------------------------------

/** Recursively flatten a NavItem[] tree into a single-level array. */
export function flattenNavItems(items: NavItem[]): NavItem[] {
  return flattenComposedNav(items);
}

/** Pre-computed flat list of every NavItem in the nav tree. */
const allNavItems = flattenComposedNav(navigation);

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Find the first NavItem whose path matches exactly. */
export function findNavItemByPath(path: string): NavItem | undefined {
  return allNavItems.find((item) => item.path === path);
}

/** Find the first NavItem whose segment matches. */
export function findNavItemBySegment(segment: string): NavItem | undefined {
  return allNavItems.find((item) => item.segment === segment);
}

// ---------------------------------------------------------------------------
// Breadcrumb helpers
// ---------------------------------------------------------------------------

/** Segment → label map. Covers nav tree + common action segments. */
export const breadcrumbNameMap: Record<string, string> =
  buildBreadcrumbLabelIndex(navigation, {
    new: 'New',
    edit: 'Edit',
    mark: 'Mark Attendance',
    join: 'Join Organization',
    profile: 'Profile',
    login: 'Login',
    admin: 'Administrator',
    'leave-requests': 'Leave Requests',
    'employee-management': 'Employee Management',
    invitations: 'Invitations',
    manage: 'Leave Dashboard',
    balance: 'Balance',
    calendar: 'Calendar',
    policies: 'Policies',
    requests: 'Requests',
  });

/** Resolve a URL segment to its breadcrumb display label. */
export function getBreadcrumbLabel(segment: string): string {
  return (
    breadcrumbNameMap[segment] ??
    segment.charAt(0).toUpperCase() + segment.slice(1).replaceAll('-', ' ')
  );
}

/** Returns true if the given segment should be hidden from breadcrumbs. */
export function isHiddenSegment(segment: string): boolean {
  return _hiddenSegments.has(segment);
}

/** Returns true if the segment should appear but NOT be clickable. */
export function isNonInteractiveSegment(segment: string): boolean {
  const item = findNavItemBySegment(segment);
  return item?.nonInteractive === true;
}

// ---------------------------------------------------------------------------
// Sidebar helpers
// ---------------------------------------------------------------------------

/** Return only the top-level navigation items that should appear in the sidebar. */
export function getSidebarItems(): NavItem[] {
  return filterSidebarItems(navigation);
}

function filterSidebarItems(items: NavItem[]): NavItem[] {
  return items
    .filter((item) => !item.sidebarHidden && !item.isDynamic)
    .map((item) => ({
      ...item,
      children: item.children ? filterSidebarItems(item.children) : [],
    }));
}

// ---------------------------------------------------------------------------
// Active-state helpers
// ---------------------------------------------------------------------------

/** Returns true when currentPath matches itemUrl or is a sub-route. */
export function isPathActive(itemUrl: string, currentPath: string): boolean {
  if (currentPath === itemUrl) return true;
  return currentPath.startsWith(itemUrl + '/');
}

// ---------------------------------------------------------------------------
// ID detection
// ---------------------------------------------------------------------------

/** Returns true if the segment looks like a numeric or UUID identifier. */
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

export type { NavItem } from '@/nav/types';
export {
  navigation,
  hiddenSegments,
  nonInteractiveSegments,
  DASHBOARD_BASE,
} from '@/nav';
export { segmentLabels } from '@/config/nav.config';
