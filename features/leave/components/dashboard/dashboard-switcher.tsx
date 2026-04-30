/**
 * components/leave/dashboard/dashboard-switcher.tsx
 *
 * UI component to switch between Employee/Manager/Admin dashboards
 */

'use client';

import { LeaveRole } from '@/hooks/leave/use-leave-role';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { User, Users, Shield } from 'lucide-react';
import { Badge } from '@/components/shadcn/badge';

interface DashboardSwitcherProps {
  currentRole: LeaveRole;
  availableRoles: LeaveRole[];
  onRoleChange: (role: LeaveRole) => void;
  pendingApprovalsCount?: number;
}

const roleConfig = {
  [LeaveRole.EMPLOYEE]: {
    label: 'Employee View',
    icon: User,
    description: 'Personal leave management',
  },
  [LeaveRole.MANAGER]: {
    label: 'Manager View',
    icon: Users,
    description: 'Team approvals & personal leave',
  },
  [LeaveRole.ADMIN]: {
    label: 'Admin View',
    icon: Shield,
    description: 'Organization-wide management',
  },
};

export function DashboardSwitcher({
  currentRole,
  availableRoles,
  onRoleChange,
  pendingApprovalsCount,
}: DashboardSwitcherProps) {
  // If only one role available, don't show switcher
  if (availableRoles.length <= 1) {
    return null;
  }

  const CurrentIcon = roleConfig[currentRole].icon;

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentRole}
        onValueChange={(value) => onRoleChange(value as LeaveRole)}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <CurrentIcon className="h-4 w-4" />
              <span>{roleConfig[currentRole].label}</span>
              {currentRole === LeaveRole.MANAGER &&
                pendingApprovalsCount &&
                pendingApprovalsCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {pendingApprovalsCount}
                  </Badge>
                )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((role) => {
            const Icon = roleConfig[role].icon;
            const showBadge =
              role === LeaveRole.MANAGER &&
              pendingApprovalsCount &&
              pendingApprovalsCount > 0;

            return (
              <SelectItem key={role} value={role}>
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {roleConfig[role].label}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {roleConfig[role].description}
                      </span>
                    </div>
                  </div>
                  {showBadge && (
                    <Badge variant="destructive" className="shrink-0">
                      {pendingApprovalsCount}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
