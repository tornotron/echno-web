'use client';

import { PageHeader } from '@/components/common';
import { Plus } from 'lucide-react';
import { useInvitationsByProject } from '@/hooks/invitation';
import {
  InvitationTable,
  InvitationEmptyState,
  InvitationFetchError,
  InvitationOverview,
} from '@/features/invitation';
import { Button } from '@/components/shadcn/button';
import Link from 'next/link';
import { routes } from '@/nav';

// TODO: Replace with project selector — invite codes are project-scoped.
// Pass a real projectId from a project context/selector component.
const PLACEHOLDER_PROJECT_ID = undefined;

export default function InvitationsPage() {
  const {
    data: invitations,
    isLoading,
    error,
  } = useInvitationsByProject(PLACEHOLDER_PROJECT_ID);

  const invitationsList = invitations ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Project Invitations"
          description="Manage and track project invite codes"
        />
        <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500">
          Loading…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Project Invitations"
          description="Manage and track project invite codes"
        />
        <InvitationFetchError />
      </div>
    );
  }

  if (invitationsList.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Project Invitations"
          description="Manage and track project invite codes"
        />
        <InvitationEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Project Invitations"
        description="Manage and track project invite codes"
        actions={
          <Button asChild>
            <Link href={routes.workforce.employees.invitations.new}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invite Code
            </Link>
          </Button>
        }
      />

      <InvitationOverview invitations={invitationsList} />

      <InvitationTable invitations={invitationsList} />
    </div>
  );
}
