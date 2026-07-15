'use client';

import { useMemo } from 'react';
import { PageHeader, OrgGuard } from '@/components/common';
import { useEmployees } from '@tornotron/echno-core/employee/hooks';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { EmployeeTable } from '@/features/employee/components/employee-table';
import { EmployeeEmptyState } from '@/features/employee/components/employee-empty-state';
import { Employee } from '@tornotron/echno-core/employee/types';

export default function EmployeesPage() {
  const { data: user, isLoading: isUserLoading, error: userError } = useUser();
  const { data: employees, isLoading, error: employeesError } = useEmployees();

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
      error={userError ?? employeesError}
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
