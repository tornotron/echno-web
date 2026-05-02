import Link from 'next/link';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Edit, Building } from 'lucide-react';
import { EmployeeAvatar } from '@/components/shared/employee-avatar';
import { getDepartmentLabel } from '@/types/employee';
import type { Employee } from '@/types/employee';

interface EmployeeDetailsHeaderProps {
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

export function EmployeeDetailsHeader({
  employee,
}: EmployeeDetailsHeaderProps) {
  return (
    <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start space-x-4">
          <EmployeeAvatar employee={employee} size="lg" />
          <div>
            <div className="mb-2 flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {employee.name}
              </h1>
              <Badge className={getStatusColor(employee.status)}>
                {getStatusLabel(employee.status)}
              </Badge>
            </div>
            <p className="mb-2 text-lg text-zinc-600 dark:text-zinc-400">
              {employee.designation}
            </p>
            {employee.department && (
              <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Building className="h-4 w-4" />
                <span>{getDepartmentLabel(employee.department)}</span>
              </div>
            )}
          </div>
        </div>
        <Link
          href={`/users/dashboard/workforce/employees/employee-management/${employee.id}/edit`}
        >
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Employee
          </Button>
        </Link>
      </div>
    </div>
  );
}
