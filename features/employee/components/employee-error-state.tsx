'use client';

import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/shadcn/button';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';

interface EmployeeErrorStateProps {
  employeeId: number;
  backLink?: string;
}

export function EmployeeErrorState({
  employeeId,
  backLink = '/users/dashboard/workforce/employees/employee-management',
}: EmployeeErrorStateProps) {
  return (
    <Empty variant="error">
      <EmptyErrorMedia>
        <AlertCircle className="size-6" />
      </EmptyErrorMedia>
      <EmptyHeader>
        <EmptyTitle>Employee Not Found</EmptyTitle>
        <EmptyDescription>
          The employee with ID {employeeId} could not be found.
        </EmptyDescription>
      </EmptyHeader>
      <Button asChild>
        <Link href={backLink}>Back to Employees List</Link>
      </Button>
    </Empty>
  );
}
