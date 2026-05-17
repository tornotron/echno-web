import Link from 'next/link';
import { routes } from '@/nav';
import { Mail, Plus } from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { Button } from '@/components/shadcn/button';

export function InvitationEmptyState() {
  return (
    <Empty variant="default">
      <EmptyMedia variant="icon">
        <Mail className="size-6" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>No Invitations Yet</EmptyTitle>
        <EmptyDescription>
          Get started by sending your first employee invitation.
        </EmptyDescription>
      </EmptyHeader>
      <Button asChild>
        <Link href={routes.workforce.employees.invitations.new}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invitation
        </Link>
      </Button>
    </Empty>
  );
}
