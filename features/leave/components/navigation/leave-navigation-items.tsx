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
  Clock,
} from 'lucide-react';
import { LeaveRole } from '@/types/leave';
import { routes } from '@/nav';

export interface LeaveNavigationItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: number | string;
  isNew?: boolean;
}

export function getEmployeeNavigationItems(
  pendingCount?: number
): LeaveNavigationItem[] {
  return [
    {
      title: 'Dashboard',
      href: routes.workforce.leaves.manage.href,
      icon: Calendar,
      description: 'Overview of your leave',
    },
    {
      title: 'Apply for Leave',
      href: routes.workforce.leaves.manage.requests.new,
      icon: Plus,
      description: 'Submit a new leave request',
    },
    {
      title: 'My Requests',
      href: routes.workforce.leaves.manage.requests.href,
      icon: FileText,
      description: 'View all your leave requests',
      badge: pendingCount,
    },
    {
      title: 'Leave Balance',
      href: routes.workforce.leaves.manage.balance,
      icon: TrendingUp,
      description: 'Check your leave balance',
    },
    {
      title: 'Leave Calendar',
      href: routes.workforce.leaves.manage.calendar,
      icon: Calendar,
      description: 'View organization calendar',
    },
  ];
}

export function getManagerNavigationItems(
  pendingApprovals?: number
): LeaveNavigationItem[] {
  return [
    {
      title: 'Dashboard',
      href: routes.workforce.leaves.manage.href,
      icon: Calendar,
      description: 'Overview and team management',
    },
    {
      title: 'Pending Approvals',
      href: `${routes.workforce.leaves.manage.requests.href}?tab=approvals`,
      icon: Clock,
      description: 'Review team leave requests',
      badge: pendingApprovals,
    },
    {
      title: 'Apply for Leave',
      href: routes.workforce.leaves.manage.requests.new,
      icon: Plus,
      description: 'Submit your leave request',
    },
    {
      title: 'My Requests',
      href: routes.workforce.leaves.manage.requests.href,
      icon: FileText,
      description: 'Your leave requests',
    },
    {
      title: 'Leave Balance',
      href: routes.workforce.leaves.manage.balance,
      icon: TrendingUp,
      description: 'Your leave balance',
    },
    {
      title: 'Team Calendar',
      href: routes.workforce.leaves.manage.calendar,
      icon: Calendar,
      description: 'View team availability',
    },
  ];
}

export function getAdminNavigationItems(
  pendingApprovals?: number
): LeaveNavigationItem[] {
  return [
    {
      title: 'Dashboard',
      href: routes.workforce.leaves.manage.href,
      icon: Calendar,
      description: 'Organization overview',
    },
    {
      title: 'All Requests',
      href: routes.workforce.leaves.manage.requests.href,
      icon: FileText,
      description: 'View all leave requests',
    },
    {
      title: 'Pending Approvals',
      href: `${routes.workforce.leaves.manage.requests.href}?tab=approvals`,
      icon: Clock,
      description: 'Review pending requests',
      badge: pendingApprovals,
    },
    {
      title: 'Leave Policies',
      href: routes.workforce.leaves.manage.policies,
      icon: Settings,
      description: 'Manage leave policies',
    },
    {
      title: 'Organization Calendar',
      href: routes.workforce.leaves.manage.calendar,
      icon: Calendar,
      description: 'View organization calendar',
    },
    {
      title: 'Apply for Leave',
      href: routes.workforce.leaves.manage.requests.new,
      icon: Plus,
      description: 'Submit your leave request',
    },
    {
      title: 'My Balance',
      href: routes.workforce.leaves.manage.balance,
      icon: TrendingUp,
      description: 'Your leave balance',
    },
  ];
}

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

export function getQuickActionItems(role: LeaveRole): LeaveNavigationItem[] {
  const baseActions: LeaveNavigationItem[] = [
    {
      title: 'Apply for Leave',
      href: routes.workforce.leaves.manage.requests.new,
      icon: Plus,
    },
    {
      title: 'My Requests',
      href: routes.workforce.leaves.manage.requests.href,
      icon: FileText,
    },
    {
      title: 'Leave Balance',
      href: routes.workforce.leaves.manage.balance,
      icon: TrendingUp,
    },
  ];

  if (role === LeaveRole.MANAGER || role === LeaveRole.ADMIN) {
    return [
      {
        title: 'Pending Approvals',
        href: `${routes.workforce.leaves.manage.requests.href}?tab=approvals`,
        icon: Users,
      },
      ...baseActions,
    ];
  }

  return baseActions;
}

export function getAdminOnlyItems(): LeaveNavigationItem[] {
  return [
    {
      title: 'Leave Policies',
      href: routes.workforce.leaves.manage.policies,
      icon: Settings,
      description: 'Configure leave policies',
    },
  ];
}
