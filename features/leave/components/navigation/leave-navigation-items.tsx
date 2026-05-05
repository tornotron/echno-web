/**
 * components/leave/navigation/leave-navigation-items.tsx
 *
 * Role-specific navigation items for leave management.
 * Returns different menu items based on user's leave role.
 */

'use client';

import {
  Calendar,
  FileText,
  TrendingUp,
  Plus,
  Users,
  Settings,
  BarChart3,
  Clock,
} from 'lucide-react';
import { LeaveRole } from '@/types/leave';

export interface LeaveNavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: number | string;
  isNew?: boolean;
}

/**
 * Get navigation items for Employee role
 */
export function getEmployeeNavigationItems(
  pendingCount?: number
): LeaveNavigationItem[] {
  return [
    {
      title: 'Dashboard',
      href: '/users/dashboard/workforce/leaves/manage',
      icon: Calendar,
      description: 'Overview of your leave',
    },
    {
      title: 'Apply for Leave',
      href: '/users/dashboard/workforce/leaves/manage/requests/new',
      icon: Plus,
      description: 'Submit a new leave request',
    },
    {
      title: 'My Requests',
      href: '/users/dashboard/workforce/leaves/manage/requests',
      icon: FileText,
      description: 'View all your leave requests',
      badge: pendingCount,
    },
    {
      title: 'Leave Balance',
      href: '/users/dashboard/workforce/leaves/manage/balance',
      icon: TrendingUp,
      description: 'Check your leave balance',
    },
    {
      title: 'Leave Calendar',
      href: '/users/dashboard/workforce/leaves/manage/calendar',
      icon: Calendar,
      description: 'View organization calendar',
    },
  ];
}

/**
 * Get navigation items for Manager role
 */
export function getManagerNavigationItems(
  pendingApprovals?: number
): LeaveNavigationItem[] {
  return [
    {
      title: 'Dashboard',
      href: '/users/dashboard/workforce/leaves/manage',
      icon: Calendar,
      description: 'Overview and team management',
    },
    {
      title: 'Pending Approvals',
      href: '/users/dashboard/workforce/leaves/manage/requests?tab=approvals',
      icon: Clock,
      description: 'Review team leave requests',
      badge: pendingApprovals,
    },
    {
      title: 'Apply for Leave',
      href: '/users/dashboard/workforce/leaves/manage/requests/new',
      icon: Plus,
      description: 'Submit your leave request',
    },
    {
      title: 'My Requests',
      href: '/users/dashboard/workforce/leaves/manage/requests',
      icon: FileText,
      description: 'Your leave requests',
    },
    {
      title: 'Leave Balance',
      href: '/users/dashboard/workforce/leaves/manage/balance',
      icon: TrendingUp,
      description: 'Your leave balance',
    },
    {
      title: 'Team Calendar',
      href: '/users/dashboard/workforce/leaves/manage/calendar',
      icon: Calendar,
      description: 'View team availability',
    },
  ];
}

/**
 * Get navigation items for Admin role
 */
export function getAdminNavigationItems(
  pendingApprovals?: number
): LeaveNavigationItem[] {
  return [
    {
      title: 'Dashboard',
      href: '/users/dashboard/workforce/leaves/manage',
      icon: Calendar,
      description: 'Organization overview',
    },
    {
      title: 'All Requests',
      href: '/users/dashboard/workforce/leaves/manage/requests',
      icon: FileText,
      description: 'View all leave requests',
    },
    {
      title: 'Pending Approvals',
      href: '/users/dashboard/workforce/leaves/manage/requests?tab=approvals',
      icon: Clock,
      description: 'Review pending requests',
      badge: pendingApprovals,
    },
    {
      title: 'Leave Policies',
      href: '/users/dashboard/workforce/leaves/manage/policies',
      icon: Settings,
      description: 'Manage leave policies',
    },
    {
      title: 'Organization Calendar',
      href: '/users/dashboard/workforce/leaves/manage/calendar',
      icon: Calendar,
      description: 'View organization calendar',
    },
    {
      title: 'Analytics',
      href: '/users/dashboard/workforce/leaves/analytics',
      icon: BarChart3,
      description: 'View usage analytics',
      isNew: true,
    },
    {
      title: 'Apply for Leave',
      href: '/users/dashboard/workforce/leaves/manage/requests/new',
      icon: Plus,
      description: 'Submit your leave request',
    },
    {
      title: 'My Balance',
      href: '/users/dashboard/workforce/leaves/manage/balance',
      icon: TrendingUp,
      description: 'Your leave balance',
    },
  ];
}

/**
 * Get navigation items based on user role
 */
export function getRoleBasedNavigationItems(
  role: LeaveRole,
  pendingCount?: number
): LeaveNavigationItem[] {
  switch (role) {
    case LeaveRole.ADMIN: {
      return getAdminNavigationItems(pendingCount);
    }
    case LeaveRole.MANAGER: {
      return getManagerNavigationItems(pendingCount);
    }
    default: {
      return getEmployeeNavigationItems(pendingCount);
    }
  }
}

/**
 * Get quick action items (shown in dashboards)
 */
export function getQuickActionItems(role: LeaveRole): LeaveNavigationItem[] {
  const baseActions: LeaveNavigationItem[] = [
    {
      title: 'Apply for Leave',
      href: '/users/dashboard/workforce/leaves/manage/requests/new',
      icon: Plus,
    },
    {
      title: 'My Requests',
      href: '/users/dashboard/workforce/leaves/manage/requests',
      icon: FileText,
    },
    {
      title: 'Leave Balance',
      href: '/users/dashboard/workforce/leaves/manage/balance',
      icon: TrendingUp,
    },
  ];

  if (role === LeaveRole.MANAGER || role === LeaveRole.ADMIN) {
    return [
      {
        title: 'Pending Approvals',
        href: '/users/dashboard/workforce/leaves/manage/requests?tab=approvals',
        icon: Users,
      },
      ...baseActions,
    ];
  }

  return baseActions;
}

/**
 * Get admin-only items
 */
export function getAdminOnlyItems(): LeaveNavigationItem[] {
  return [
    {
      title: 'Leave Policies',
      href: '/users/dashboard/workforce/leaves/manage/policies',
      icon: Settings,
      description: 'Configure leave policies',
    },
    {
      title: 'Analytics',
      href: '/users/dashboard/workforce/leaves/analytics',
      icon: BarChart3,
      description: 'View analytics',
    },
  ];
}
