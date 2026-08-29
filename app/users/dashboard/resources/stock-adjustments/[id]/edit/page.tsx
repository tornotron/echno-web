'use client';

import { use } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Loader2, Save, Settings } from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useStockAdjustment,
  useUpdateStockAdjustment,
} from '@/hooks/stock-adjustments';
import {
  StockAdjustmentForm,
  STOCK_ADJUSTMENT_FORM_ID,
  type StockAdjustmentSubmitData,
} from '@/features/stock-adjustments/components';
import type { StockAdjustment } from '@/types/resource';

export default function EditStockAdjustmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    data: adjustment,
    isLoading,
    isError,
  } = useStockAdjustment(Number.parseInt(id));

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex h-96 items-center justify-center">
          <div className="text-zinc-500 dark:text-zinc-400">
            Loading adjustment...
          </div>
        </div>
      </div>
    );
  }

  if (isError || !adjustment) {
    return (
      <Empty variant="default">
        <EmptyMedia variant="icon">
          <Settings className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Stock adjustment not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or the link is invalid.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline">
          <Link href={routes.resources.stockAdjustments.href}>
            Back to Stock Adjustments
          </Link>
        </Button>
      </Empty>
    );
  }

  return <AdjustmentEditor adjustment={adjustment} id={id} />;
}

/**
 * Edits an existing adjustment through the same form the create screen uses.
 *
 * The screen used to carry its own copy of the form, which collected a
 * hard-coded location string and no project at all. Since the backend replaces
 * the header wholesale on update, saving that copy cleared the project off any
 * document that had one, leaving a draft that could no longer be approved.
 */
function AdjustmentEditor({
  adjustment,
  id,
}: {
  adjustment: StockAdjustment;
  id: string;
}) {
  const router = useRouter();
  const updateAdjustment = useUpdateStockAdjustment();

  async function handleSubmit(data: StockAdjustmentSubmitData) {
    try {
      await updateAdjustment.mutateAsync({
        id: Number.parseInt(id),
        data,
      });
      toast.success('Stock adjustment updated');
      router.push(routes.resources.stockAdjustments.detail(id).href);
    } catch (error) {
      toast.error('Failed to update stock adjustment', {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        sticky
        title="Edit Stock Adjustment"
        description={adjustment.adjustmentNumber}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={routes.resources.stockAdjustments.detail(id).href}>
                Cancel
              </Link>
            </Button>
            <Button
              type="submit"
              form={STOCK_ADJUSTMENT_FORM_ID}
              disabled={updateAdjustment.isPending}
            >
              {updateAdjustment.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </>
        }
      />
      <StockAdjustmentForm initial={adjustment} onSubmit={handleSubmit} />
    </div>
  );
}
