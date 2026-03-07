'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEmployees } from '@/hooks/employee';
import { Loader2, AlertCircle } from 'lucide-react';
import { EditEmployeeForm } from '@/features/employee/components/edit-employee-form';

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
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show error state
  if (error || !employee) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold">Employee Not Found</h2>
        <p className="mb-4 text-zinc-500">
          The employee with ID {employeeId} could not be found.
        </p>
        <Button
          onClick={() => router.push('/users/dashboard/workforce/employees')}
        >
          Back to Employees
        </Button>
      </div>
    );
  }

  return <EditEmployeeForm employee={employee} />;
}
