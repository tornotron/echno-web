'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/common';
import { useEmployees } from '@/hooks/employee';
import { useUser } from '@/hooks/user/use-user';
import { Employee } from '@/types/employee';
import { EmployeeOverview } from '@/features/employee/components/employee-overview';
import { EmployeeCharts } from '@/features/employee/components/employee-charts';

export default function EmployeesPage() {
  const { data: user } = useUser();
  const { data: employees, isLoading } = useEmployees();

  const list = useMemo<Employee[]>(() => employees ?? [], [employees]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <PageHeader
        title="Employee Overview"
        description="Workforce insights and analytics for your organization"
      />

      {/* ── Active employees overview ─────────────────────────────────── */}
      {!isLoading && list.length > 0 && <EmployeeOverview employees={list} />}

      {/* ── Charts ───────────────────────────────────────────────────── */}
      {!isLoading && list.length > 0 && <EmployeeCharts employees={list} />}
    </div>
  );
}
