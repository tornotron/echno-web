'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorMessage } from '@tornotron/echno-core';
import { useCreateStockAdjustment } from '@/hooks/stock-adjustments/use-stock-adjustments';
import {
  StockAdjustmentForm,
  STOCK_ADJUSTMENT_FORM_ID,
  type StockAdjustmentSubmitData,
} from '@/features/stock-adjustments/components';

export default function CreateStockAdjustmentPage() {
  const router = useRouter();
  const createAdjustment = useCreateStockAdjustment();

  async function handleSubmit(data: StockAdjustmentSubmitData) {
    try {
      await createAdjustment.mutateAsync(data);
      toast.success('Stock adjustment created');
      router.push(routes.resources.stockAdjustments.href);
    } catch (error) {
      toast.error('Failed to create stock adjustment', {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        sticky
        title="Create Stock Adjustment"
        description="Record stock adjustments from physical counts or corrections"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={routes.resources.stockAdjustments.href}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              form={STOCK_ADJUSTMENT_FORM_ID}
              disabled={createAdjustment.isPending}
            >
              {createAdjustment.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Create Adjustment
            </Button>
          </>
        }
      />
      <StockAdjustmentForm onSubmit={handleSubmit} />
    </div>
  );
}
