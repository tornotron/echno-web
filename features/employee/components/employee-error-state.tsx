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
  variant?: 'not-found' | 'fetch-error';
  backLink?: string;
}

export function EmployeeErrorState({
  employeeId,
  variant = 'not-found',
  backLink = '/users/dashboard/workforce/employees/employee-management',
}: EmployeeErrorStateProps) {
  const title =
    variant === 'fetch-error'
      ? 'Failed to Load Employee'
      : 'Employee Not Found';
  const description =
    variant === 'fetch-error'
      ? `An error occurred while loading employee ${employeeId}. Please try again.`
      : `The employee with ID ${employeeId} could not be found.`;

  return (
    <Empty variant="error">
      <EmptyErrorMedia>
        <AlertCircle className="size-6" />
      </EmptyErrorMedia>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <Button asChild>
        <Link href={backLink}>Back to Employees List</Link>
      </Button>
    </Empty>
  );
}
