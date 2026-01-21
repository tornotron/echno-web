'use client';

import { Employee, getDepartmentLabel } from '@/types/employee';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building, User, IdCard } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface EmployeeCardProps {
  employee: Employee;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case 'inactive': {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    case 'onLeave': {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'active': {
      return 'Active';
    }
    case 'inactive': {
      return 'Inactive';
    }
    case 'onLeave': {
      return 'On Leave';
    }
    default: {
      return status;
    }
  }
};

export function EmployeeCard({ employee }: EmployeeCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <Link
        href={`/users/dashboard/workforce/employees/${employee.id}`}
        className="block"
      >
        <CardContent className="p-6">
          {/* Header with Avatar and Status */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {employee.name}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {employee.designation}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(employee.status)}>
              {getStatusLabel(employee.status)}
            </Badge>
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
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-zinc-400" />
              <span className="text-zinc-600 dark:text-zinc-400">
                {employee.phone}
              </span>
            </div>
          </div>

          {/* Organizations */}
          {employee.organizations && employee.organizations.length > 0 && (
            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-500">
                Organizations
              </p>
              <div className="flex flex-wrap gap-1">
                {employee.organizations.slice(0, 2).map((org) => (
                  <Badge key={org.id} variant="outline" className="text-xs">
                    {org.organizationName}
                  </Badge>
                ))}
                {employee.organizations.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{employee.organizations.length - 2}
                  </Badge>
                )}
              </div>
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
