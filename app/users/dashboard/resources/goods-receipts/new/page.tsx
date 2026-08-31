'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/shadcn/badge';
import { AlertCircle, Loader2, Send, ShoppingCart } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import {
  usePurchaseOrder,
  poKeys,
} from '@tornotron/echno-core/purchase-orders/hooks';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import { useClearFormDraft } from '@/hooks/use-form-draft';
import { FORM_DRAFT_IDS } from '@/lib/forms/form-draft-ids';
import { useCreateGRN } from '@tornotron/echno-core/grn/hooks';
import { getErrorTitle, getErrorMessage } from '@tornotron/echno-core';
import type { PurchaseOrder } from '@tornotron/echno-core/purchase-orders/types';
import {
  GoodsReceiptForm,
  GOODS_RECEIPT_FORM_ID,
  type GRNItemRow,
  type GoodsReceiptFormState,
  type GoodsReceiptSubmitData,
} from '@/features/grn/components';

export default function NewGRNPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const fromPOId = Number(searchParams.get('fromPO')) || 0;

  const { data: currentEmployee } = useCurrentUserEmployee();
  const { data: sourcePO } = usePurchaseOrder(fromPOId);
  const { mutate: createGRN, isPending } = useCreateGRN();
  const clearFormDraft = useClearFormDraft();

  // Read cache synchronously so navigation pre-fill works without waiting for an effect
  const cachedPO = fromPOId
    ? queryClient.getQueryData<PurchaseOrder>(poKeys.detail(fromPOId))
    : undefined;

  // Wait for PO to load when navigating from a PO page with no cache
  if (fromPOId && !sourcePO && !cachedPO) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const resolvedPO = sourcePO ?? cachedPO;

  const initialValues: Partial<GoodsReceiptFormState> = resolvedPO
    ? {
        vendorId: resolvedPO.vendorId,
        purchaseOrderId: resolvedPO.id,
        projectId: resolvedPO.projectId || 0,
      }
    : {};

  const initialItems: GRNItemRow[] | undefined = resolvedPO?.items.length
    ? resolvedPO.items.map((item) => ({
        materialId: item.materialId,
        materialName: item.materialName,
        orderedQuantity: item.orderedQuantity,
        receivedQuantity: item.orderedQuantity,
        unitCost: item.unitPrice ?? 0,
      }))
    : undefined;

  function handleSubmit(data: GoodsReceiptSubmitData) {
    if (!currentEmployee?.id) {
      toast.error('Unable to determine current employee.');
      return;
    }
    createGRN(
      {
        receivedOn: new Date(data.form.receivedOn).toISOString(),
        receivedByEmployeeId: currentEmployee.id,
        vendorId: data.form.vendorId,
        purchaseOrderId: data.form.purchaseOrderId || undefined,
        projectId: data.form.projectId || undefined,
        storageLocationId: data.form.storageLocationId || undefined,
        deliveryChallanNumber:
          data.form.deliveryChallanNumber.trim() || undefined,
        invoiceNumber: data.form.invoiceNumber.trim() || undefined,
        invoiceAmount: data.form.invoiceAmount
          ? Number.parseFloat(data.form.invoiceAmount)
          : undefined,
        items: data.items.map((item) => ({
          materialId: item.materialId,
          orderedQuantity: item.orderedQuantity,
          receivedQuantity: item.receivedQuantity,
          unitCost: item.unitCost || undefined,
        })),
      },
      {
        onSuccess: (grn) => {
          // The record exists now, so the local draft describes work already done.
          // Left behind it would be offered on the next visit to this form.
          clearFormDraft(FORM_DRAFT_IDS.GOODS_RECEIPT);

          toast.success('GRN Recorded', {
            description:
              'Goods received note recorded successfully. Stock has been updated.',
          });
          router.push(routes.resources.goodsReceipts.detail(grn.id).href);
        },
        onError: (err) =>
          toast.error(getErrorTitle(err, 'Failed to Record GRN'), {
            description: getErrorMessage(err),
          }),
      }
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        sticky
        title="Record GRN"
        description="Record a goods received note"
        actions={
          <>
            <Button variant="outline" disabled={isPending} asChild>
              <Link href={routes.resources.goodsReceipts.href}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              form={GOODS_RECEIPT_FORM_ID}
              disabled={isPending || !currentEmployee}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Record GRN
                </>
              )}
            </Button>
          </>
        }
      />

      {sourcePO && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <ShoppingCart className="h-4 w-4 flex-shrink-0" />
          <span>
            Pre-filled from purchase order{' '}
            <Badge
              variant="outline"
              className="mx-1 border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300"
            >
              {sourcePO.poNumber}
            </Badge>
            — adjust received quantities to match what was actually delivered.
          </span>
          <Link
            href={routes.resources.purchaseOrders.detail(sourcePO.id).href}
            className="ml-auto flex-shrink-0 font-medium underline-offset-2 hover:underline"
          >
            View PO
          </Link>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          GRN creation automatically updates material stock. This cannot be
          undone — verify quantities carefully before submitting.
        </span>
      </div>

      <GoodsReceiptForm
        initialValues={initialValues}
        initialItems={initialItems}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
