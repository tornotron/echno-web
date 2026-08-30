'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { routes } from '@/nav';
import { useAuthorization } from '@/hooks/use-authorization';
import { PayablesView } from '@/features/payables';

export default function PayablesPage() {
  const router = useRouter();
  const { isSystemAdmin, isLoading } = useAuthorization();

  if (isLoading) {
    return null;
  }

  // Every mapping on PayableControllerWeb, the listing included, is behind
  // hasAnyOrgRoleForCurrentTenant('system-admin'), so a caller outside that
  // role cannot even list the payables. The sibling PayableController is the
  // mobile one, gated on flat payable:* authorities the web session does not
  // carry, so there is no second route in for anyone else.
  if (!isSystemAdmin) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don&apos;t have permission to view payables. They are restricted
            to system administrators.
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
        title="Payables"
        description="Amounts owed to contractors and vendors. A payable is raised for what is owed, and payments are recorded against it until it is settled; a payment can never take one past the amount it was raised for."
      />
      <PayablesView />
    </div>
  );
}
