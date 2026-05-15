import { routes } from '@/nav';

/** Map of `from` query-param values → breadcrumb overrides for leave request detail pages. */
export const leaveFromMap: Record<string, { label: string; href: string }> = {
  'my-requests': {
    label: 'My Requests',
    href: `${routes.workforce.leaves.manage.requests.href}?tab=my`,
  },
  'org-requests': {
    label: 'Organization Requests',
    href: `${routes.workforce.leaves.manage.requests.href}?tab=all`,
  },
  approvals: {
    label: 'Pending Approvals',
    href: `${routes.workforce.leaves.manage.requests.href}?tab=approvals`,
  },
  'employee-dashboard': {
    label: 'Leave Management',
    href: routes.workforce.leaves.manage.href,
  },
  'manager-dashboard': {
    label: 'Leave Management',
    href: routes.workforce.leaves.manage.href,
  },
  'admin-dashboard': {
    label: 'Leave Management',
    href: routes.workforce.leaves.manage.href,
  },
};
