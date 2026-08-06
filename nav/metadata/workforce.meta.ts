import {
  Users,
  Calendar,
  LayoutDashboard,
  FileText,
  TrendingUp,
  Settings,
} from 'lucide-react';
import type { MetadataRegistry } from '../types';

export const workforceMetadata = {
  workforce: {
    label: 'Workforce',
    icon: Users,
    nonInteractive: true,
    order: 5,
  },

  // ── employees ─────────────────────────────────────────────────────────────
  'workforce-employees': {
    label: 'Employees',
    icon: Users,
    order: 1,
  },
  'workforce-employees-employee-management': {
    label: 'Employee Management',
    sidebarHidden: true,
    breadcrumb: 'Employee Management',
  },
  'workforce-employees-employee-management-[id]': {
    label: 'Employee',
    sidebarHidden: true,
  },
  'workforce-employees-employee-management-[id]-edit': {
    label: 'Edit',
    sidebarHidden: true,
  },
  'workforce-employees-invitations': {
    label: 'Invitations',
    sidebarHidden: true,
  },
  'workforce-employees-invitations-new': {
    label: 'New Invitation',
    sidebarHidden: true,
  },
  'workforce-employees-invitations-[id]': {
    label: 'Invitation',
    sidebarHidden: true,
  },

  // ── leaves ────────────────────────────────────────────────────────────────
  'workforce-leaves': {
    label: 'Employee Leave',
    icon: Calendar,
    breadcrumb: 'Leaves',
    order: 2,
  },
  'workforce-leaves-manage': {
    label: 'Leave Dashboard',
    icon: LayoutDashboard,
    order: 1,
  },
  'workforce-leaves-manage-requests': {
    label: 'Requests',
    icon: FileText,
    order: 1,
  },
  'workforce-leaves-manage-requests-new': {
    label: 'New Request',
    sidebarHidden: true,
  },
  'workforce-leaves-manage-requests-[id]': {
    label: 'Leave Request',
    sidebarHidden: true,
  },
  'workforce-leaves-manage-calendar': {
    label: 'Calendar',
    icon: Calendar,
    order: 2,
  },
  'workforce-leaves-manage-balance': {
    label: 'Balance',
    icon: TrendingUp,
    order: 3,
  },
  'workforce-leaves-manage-policies': {
    label: 'Policies',
    icon: Settings,
    order: 4,
  },
} satisfies MetadataRegistry;
