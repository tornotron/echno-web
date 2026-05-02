'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/common';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { Button } from '@/components/shadcn/button';
import { Users, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { useEmployees } from '@/hooks/employee';
import { useUser } from '@/hooks/user/use-user';
import { Employee } from '@/types/employee';
import { EmployeeTable } from '@/features/employee/components/employee-table';
import { EmployeeEmptyState } from '@/features/employee/components/employee-empty-state';

export default function EmployeesPage() {
  const { data: user } = useUser();
  const { data: employees, isLoading, error } = useEmployees();

  const employeesList = useMemo<Employee[]>(() => employees ?? [], [employees]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold">Error Loading Employees</h2>
        <p className="text-zinc-500">
          Failed to load employees. Please try again later.
        </p>
      </div>
    );
  }

  if (!user?.defaultOrganizationId) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-yellow-500" />
        <h2 className="mb-2 text-xl font-semibold">No Organization Selected</h2>
        <p className="text-zinc-500">
          Please select an organization to view employees.
        </p>
      </div>
    );
  }

  if (employeesList.length === 0) {
    return <EmployeeEmptyState />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Employee Management"
        description="Manage and view all employees in your organization"
      />
      <EmployeeTable employees={employeesList} />
    </div>
  );
}
