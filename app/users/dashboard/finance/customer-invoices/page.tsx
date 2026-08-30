'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { routes } from '@/nav';
import { useAuthorization } from '@/hooks/use-authorization';
import { CustomerInvoicesView } from '@/features/customer-invoices';

export default function CustomerInvoicesPage() {
  const router = useRouter();
  const { isSystemAdmin, isManager, isLoading } = useAuthorization();

  if (isLoading) {
    return null;
  }

  // Every mapping on InvoiceControllerWeb, the listing included, is behind
  // hasAnyOrgRoleForCurrentTenant('system-admin', 'project-manager'), so a
  // caller outside that set cannot even list the invoices.
  if (!isSystemAdmin && !isManager) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don&apos;t have permission to view customer invoices. They are
            restricted to system administrators and project managers.
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
        title="Customer Invoices"
        description="Receivables raised to a customer. A draft posts nothing until it is issued; issuing debits Accounts Receivable, and cancelling an issued invoice reverses that entry. An invoice with a payment against it is corrected with a credit note instead."
      />
      <CustomerInvoicesView />
    </div>
  );
}
