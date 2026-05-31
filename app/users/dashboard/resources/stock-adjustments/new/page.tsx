'use client';

import Link from 'next/link';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Save } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import {
  StockAdjustmentForm,
  STOCK_ADJUSTMENT_FORM_ID,
  type StockAdjustmentSubmitData,
} from '@/features/stock-adjustments/components';

function handleSubmit(_data: StockAdjustmentSubmitData) {
  toast.error('Stock adjustment creation is not yet available');
}

export default function CreateStockAdjustmentPage() {
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
            <Button type="submit" form={STOCK_ADJUSTMENT_FORM_ID}>
              <Save className="mr-2 h-4 w-4" />
              Create Adjustment
            </Button>
          </>
        }
      />
      <StockAdjustmentForm onSubmit={handleSubmit} />
    </div>
  );
}
