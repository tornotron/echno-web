import Link from 'next/link';
import { UserPlus, Users } from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';

export function EmployeeEmptyState() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Employee Management"
        description="Manage and view all employees in your organization"
      />
      <Empty variant="default">
        <EmptyMedia variant="icon">
          <Users className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>No Employees Yet</EmptyTitle>
          <EmptyDescription>
            Get started by inviting your first employee.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href="/users/dashboard/workforce/employees/invitations/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Create Invitation
          </Link>
        </Button>
      </Empty>
    </div>
  );
}
