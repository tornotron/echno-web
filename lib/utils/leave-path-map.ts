/** Map of `from` query-param values → breadcrumb overrides for leave request detail pages. */

export const leaveFromMap: Record<string, { label: string; href: string }> = {
  'my-requests': {
    label: 'My Requests',
    href: '/users/dashboard/workforce/leaves/requests',
  },
  'org-requests': {
    label: 'Organization Requests',
    href: '/users/dashboard/workforce/leaves/organization-requests',
  },
  approvals: {
    label: 'Pending Approvals',
    href: '/users/dashboard/workforce/leaves/approvals',
  },
  'employee-dashboard': {
    label: 'Leave Management',
    href: '/users/dashboard/workforce/leaves',
  },
  'manager-dashboard': {
    label: 'Leave Management',
    href: '/users/dashboard/workforce/leaves',
  },
  'admin-dashboard': {
    label: 'Leave Management',
    href: '/users/dashboard/workforce/leaves',
  },
};
