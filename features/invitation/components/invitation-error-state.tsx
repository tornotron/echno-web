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

interface InvitationErrorStateProps {
  inviteCode: string;
  backLink?: string;
}

export function InvitationErrorState({
  inviteCode,
  backLink = '/users/dashboard/workforce/employees/invitations',
}: InvitationErrorStateProps) {
  return (
    <Empty variant="error">
      <EmptyErrorMedia>
        <AlertCircle className="size-6" />
      </EmptyErrorMedia>
      <EmptyHeader>
        <EmptyTitle>Invitation Not Found</EmptyTitle>
        <EmptyDescription>
          TThe invitation code &quot;{inviteCode}&quot; could not be found or is
          invalid.
        </EmptyDescription>
      </EmptyHeader>
      <Button asChild>
        <Link href={backLink}>Back to Invitations</Link>
      </Button>
    </Empty>
  );
}
