'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useEmployees } from '@tornotron/echno-core/employee/hooks';
import { Loader2 } from 'lucide-react';
import { EditEmployeeForm } from '@/features/employee/components/edit-employee-form';
import { EmployeeErrorState } from '@/features/employee/components/employee-error-state';
import { PageHeader } from '@/components/common';
import { EmployeeAvatar } from '@/components/shared/employee-avatar';

interface EditEmployeePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditEmployeePage({ params }: EditEmployeePageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const employeeId = Number.parseInt(resolvedParams.id);
  const { data: employees, isLoading, error } = useEmployees();
  const employee = employees?.find((e) => e.id === employeeId);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return <EmployeeErrorState employeeId={employeeId} variant="fetch-error" />;
  }

  if (!employee) {
    return <EmployeeErrorState employeeId={employeeId} variant="not-found" />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        avatar={<EmployeeAvatar employee={employee} size="md" />}
        title="Edit Employee"
        subtitle={`Update ${employee.name}'s information`}
      />

      <EditEmployeeForm employee={employee} />
    </div>
  );
}
