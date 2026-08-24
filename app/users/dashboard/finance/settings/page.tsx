'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { routes } from '@/nav';
import { useAuthorization } from '@/hooks/use-authorization';
import { FinanceSettingsView } from '@/features/finance-settings';

export default function FinanceSettingsPage() {
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
            You don&apos;t have permission to manage finance settings. This
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
        title="Finance Settings"
        description="Configure the ledger posting accounts and the invoice approval threshold for your organization."
      />
      <FinanceSettingsView />
    </div>
  );
}
