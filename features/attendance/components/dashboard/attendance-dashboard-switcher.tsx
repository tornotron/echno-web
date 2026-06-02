'use client';

import { AttendanceRole } from '@/hooks/attendance';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Users, Shield } from 'lucide-react';

interface AttendanceDashboardSwitcherProps {
  currentRole: AttendanceRole;
  availableRoles: AttendanceRole[];
  onRoleChange: (role: AttendanceRole) => void;
}

const roleConfig = {
  [AttendanceRole.EMPLOYEE]: {
    label: 'My Attendance',
    icon: User,
    description: 'Personal attendance view',
  },
  [AttendanceRole.MANAGER]: {
    label: 'Manager View',
    icon: Users,
    description: 'Project-wise attendance management',
  },
  [AttendanceRole.ADMIN]: {
    label: 'Admin View',
    icon: Shield,
    description: 'Organization-wide management',
  },
};

export function AttendanceDashboardSwitcher({
  currentRole,
  availableRoles,
  onRoleChange,
}: AttendanceDashboardSwitcherProps) {
  if (availableRoles.length <= 1) return null;

  const CurrentIcon = roleConfig[currentRole].icon;

  return (
    <Select
      value={currentRole}
      onValueChange={(value) => onRoleChange(value as AttendanceRole)}
    >
      <SelectTrigger className="w-[220px]">
        <SelectValue>
          <div className="flex items-center gap-2">
            <CurrentIcon className="h-4 w-4" />
            <span>{roleConfig[currentRole].label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableRoles.map((role) => {
          const Icon = roleConfig[role].icon;
          return (
            <SelectItem key={role} value={role}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-medium">{roleConfig[role].label}</span>
                  <span className="text-muted-foreground text-xs">
                    {roleConfig[role].description}
                  </span>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
