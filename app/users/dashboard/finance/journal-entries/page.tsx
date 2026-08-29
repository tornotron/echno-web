'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { routes } from '@/nav';
import { useAuthorization } from '@/hooks/use-authorization';
import { JournalEntriesView } from '@/features/journal-entries';

export default function JournalEntriesPage() {
  const router = useRouter();
  const { isSystemAdmin, isManager, isLoading } = useAuthorization();

  if (isLoading) {
    return null;
  }

  // Every mapping on JournalEntryControllerWeb, the reads included, is behind
  // hasAnyOrgRoleForCurrentTenant('system-admin', 'project-manager'), so a
  // caller outside that set cannot even list the entries.
  if (!isSystemAdmin && !isManager) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don&apos;t have permission to view the ledger. Journal entries
            are restricted to system administrators and project managers.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.push(routes.finance.href)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Finance
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Journal Entries"
        description="Every posting on the general ledger. A posted entry cannot be edited; a wrong one is corrected by reversing it, which posts a second entry with the debits and credits swapped."
      />
      <JournalEntriesView />
    </div>
  );
}
