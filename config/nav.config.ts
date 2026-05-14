/**
 * config/nav.config.ts
 *
 * Backward-compatibility shim.
 *
 * All logic has moved to the nav/ platform.
 * This file re-exports everything that existing consumers expect
 * so they continue to work without any changes.
 *
 * Migrate imports to '@/nav' when convenient:
 *   Before: import { navigation } from '@/config/nav.config'
 *   After:  import { navigation } from '@/nav'
 */

export type { NavItem } from '@/nav/types';

export {
  DASHBOARD_BASE,
  navigation,
  publicRoutes,
  hiddenSegments,
  nonInteractiveSegments,
} from '@/nav';

// ---------------------------------------------------------------------------
// segmentLabels — legacy flat map for breadcrumbs
// Maintained here for any direct consumer that imports it.
// The new system uses breadcrumbUtils.labelMap from @/nav instead.
// ---------------------------------------------------------------------------

export const segmentLabels: Record<string, string> = {
  new: 'New',
  edit: 'Edit',
  'all-task': 'All Tasks',
  'all-tasks': 'All Tasks',
  'all-issue': 'All Issues',
  'all-issues': 'All Issues',
  'all-projects': 'All Projects',
  mark: 'Mark Attendance',
  join: 'Join Organization',
  profile: 'Profile',
  login: 'Login',
  admin: 'Administrator',
  'leave-requests': 'Leave Requests',
  'employee-management': 'Employee Management',
  invitations: 'Invitations',
};
