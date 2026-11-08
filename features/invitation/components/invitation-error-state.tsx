'use client';

import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';

interface InvitationErrorStateProps {
  backLink?: string;
}

export function InvitationErrorState({
  backLink = routes.workforce.employees.invitations.href,
}: InvitationErrorStateProps) {
  return (
    <Empty variant="error">
      <EmptyErrorMedia>
        <AlertCircle className="size-6" />
      </EmptyErrorMedia>
      <EmptyHeader>
        <EmptyTitle>Invitation Not Found</EmptyTitle>
        <EmptyDescription>
          This invitation could not be found in your organization.
        </EmptyDescription>
      </EmptyHeader>
      <Button asChild>
        <Link href={backLink}>Back to Invitations</Link>
      </Button>
    </Empty>
  );
}
