import { Button } from '@/components/shadcn/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export function InvitationHeader() {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Employee Invitations
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Manage and track employee invitation status
        </p>
      </div>
      <Button asChild className="mt-4 md:mt-0">
        <Link href="/users/dashboard/workforce/employees/invitations/new">
          <Plus className="mr-2 h-4 w-4" />
          Create Invitation
        </Link>
      </Button>
    </div>
  );
}
