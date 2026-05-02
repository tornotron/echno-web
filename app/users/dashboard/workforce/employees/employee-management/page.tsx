'use client';

import { useMemo } from 'react';
import { PageHeader, OrgGuard } from '@/components/common';
import { useEmployees } from '@/hooks/employee';
import { useUser } from '@/hooks/user/use-user';
import { EmployeeTable } from '@/features/employee/components/employee-table';
import { EmployeeEmptyState } from '@/features/employee/components/employee-empty-state';
import { Employee } from '@/types/employee';

export default function EmployeesPage() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: employees, isLoading, error } = useEmployees();

  const employeesList = useMemo<Employee[]>(
    () =>
      (employees ?? []).filter(
        (emp) => emp.organizationId === user?.defaultOrganizationId
      ),
    [employees, user?.defaultOrganizationId]
  );

  return (
    <OrgGuard
      isLoading={isUserLoading || isLoading}
      error={error}
      organizationId={user?.defaultOrganizationId}
    >
      {employeesList.length === 0 ? (
        <EmployeeEmptyState />
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <PageHeader
            title="Employee Management"
            description="Manage and view all employees in your organization"
          />
          <EmployeeTable employees={employeesList} />
        </div>
      )}
    </OrgGuard>
  );
}
