'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { routes } from '@/nav';
import { useAuthorization } from '@/hooks/use-authorization';
import { ChartOfAccountsView } from '@/features/chart-of-accounts';

export default function ChartOfAccountsPage() {
  const router = useRouter();
  const { isManagerOrAbove, isLoading } = useAuthorization();

  if (isLoading) {
    return null;
  }

  if (!isManagerOrAbove) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don&apos;t have permission to manage the chart of accounts. This
            feature is restricted to administrators and project managers.
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
        title="Chart of Accounts"
        description="Manage the ledger accounts used for double-entry bookkeeping, and import or export the chart as CSV."
      />
      <ChartOfAccountsView />
    </div>
  );
}
