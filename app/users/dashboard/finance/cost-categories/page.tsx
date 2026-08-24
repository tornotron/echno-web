'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { routes } from '@/nav';
import { useAuthorization } from '@/hooks/use-authorization';
import { CostCategoriesView } from '@/features/cost-categories';

export default function CostCategoriesPage() {
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
            You don&apos;t have permission to manage cost categories. This
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
        title="Cost Categories"
        description="Manage the budget heads used to allocate project budgets and tag invoice costs for cost control."
      />
      <CostCategoriesView />
    </div>
  );
}
