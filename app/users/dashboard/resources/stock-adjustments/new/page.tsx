'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useCreateStockAdjustment,
  useStockAdjustment,
} from '@/hooks/stock-adjustments/use-stock-adjustments';
import {
  StockAdjustmentForm,
  STOCK_ADJUSTMENT_FORM_ID,
  type StockAdjustmentSubmitData,
} from '@/features/stock-adjustments/components';

export default function CreateStockAdjustmentPage() {
  const router = useRouter();
  const createAdjustment = useCreateStockAdjustment();

  // `?from=<id>` raises a fresh draft carrying an existing adjustment's header
  // and lines. A rejection is terminal, so answering an objection means
  // retyping the whole count sheet unless the refused document can be copied.
  // The copy is a new document: it carries no rejection, and the adjustment
  // number is left for the form to generate because it has to be unique.
  const searchParams = useSearchParams();
  const copyFrom = Number.parseInt(searchParams.get('from') ?? '', 10);
  const copying = Number.isFinite(copyFrom) && copyFrom > 0;
  const { data: source, isPending: sourcePending } = useStockAdjustment(
    copying ? copyFrom : 0
  );
  const initial =
    copying && source ? { ...source, adjustmentNumber: '' } : undefined;

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
        description={
          copying
            ? 'Raised from an existing adjustment. Check every line before submitting.'
            : 'Record stock adjustments from physical counts or corrections'
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={routes.resources.stockAdjustments.href}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              form={STOCK_ADJUSTMENT_FORM_ID}
              disabled={createAdjustment.isPending || (copying && !source)}
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
      {/*
        The form seeds its state once, on first render, so a copy has to wait
        for the source document rather than mount blank and never catch up.
      */}
      {copying && sourcePending && (
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading the adjustment this one is raised from…
        </div>
      )}
      {copying && !sourcePending && !source && (
        <p className="text-sm text-red-600 dark:text-red-400">
          The adjustment this one was to be raised from could not be loaded.
          Open it again from the list, or start a blank adjustment.
        </p>
      )}
      {(!copying || !!source) && (
        <StockAdjustmentForm initial={initial} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
