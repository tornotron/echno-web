'use client';

import { useMemo } from 'react';
import { PageHeader, OrgGuard } from '@/components/common';
import { useEmployees } from '@/hooks/employee';
import { useUser } from '@/hooks/user/use-user';
import { EmployeeOverview } from '@/features/employee/components/employee-overview';
import { EmployeeCharts } from '@/features/employee/components/employee-charts';
import { EmployeeEmptyState } from '@/features/employee/components/employee-empty-state';

export default function EmployeesPage() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: employees, isLoading, error } = useEmployees();

  const list = useMemo(
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
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Employee Overview"
          description="Workforce insights and analytics for your organization"
        />

        {list.length === 0 ? (
          <EmployeeEmptyState />
        ) : (
          <>
            <EmployeeOverview employees={list} />
            <EmployeeCharts employees={list} />
          </>
        )}
      </div>
    </OrgGuard>
  );
}
