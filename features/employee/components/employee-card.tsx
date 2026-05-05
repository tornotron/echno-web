'use client';

import { Employee, getDepartmentLabel } from '@/types/employee';
import { Card, CardContent } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { Mail, Building, IdCard } from 'lucide-react';
import { PhoneDisplay } from '@/components/shadcn/phone-input';
import Link from 'next/link';
import { format } from 'date-fns';
import { EmployeeStatusBadge } from './employee-status-badge';
import { EmployeeAvatar } from '@/components/shared/employee-avatar';

interface EmployeeCardProps {
  employee: Employee;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <Link
        href={`/users/dashboard/workforce/employees/employee-management/${employee.id}`}
        className="block"
      >
        <CardContent className="p-6">
          {/* Header with Avatar and Status */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <EmployeeAvatar
                employee={employee}
                size="sm"
                className="size-12"
              />
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {employee.name}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {employee.designation}
                </p>
              </div>
            </div>
            <EmployeeStatusBadge status={employee.status} />
          </div>

          {/* Department and Employee ID */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Building className="h-4 w-4 text-zinc-400" />
              <span className="text-zinc-600 dark:text-zinc-400">
                {getDepartmentLabel(employee.department)}
              </span>
            </div>
            {employee.employeeId && (
              <div className="flex items-center space-x-2 text-sm">
                <IdCard className="h-4 w-4 text-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-400">
                  {employee.employeeId}
                </span>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="h-4 w-4 text-zinc-400" />
              <span className="truncate text-zinc-600 dark:text-zinc-400">
                {employee.email}
              </span>
            </div>
            <PhoneDisplay
              value={employee.phone}
              asLink
              className="text-sm text-zinc-600 dark:text-zinc-400"
            />
          </div>

          {/* Organization */}
          {employee.organizationName && (
            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-500">
                Organization
              </p>
              <Badge variant="outline" className="text-xs">
                {employee.organizationName}
              </Badge>
            </div>
          )}

          {/* Joining Date */}
          {employee.joiningDate && (
            <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Joined on {format(employee.joiningDate, 'MMM d, yyyy')}
              </p>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
