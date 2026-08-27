'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/shadcn/badge';
import { Loader2, Send, FolderOpen } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorTitle, getErrorMessage } from '@tornotron/echno-core';
import { useIndent, indentsKeys } from '@tornotron/echno-core/indents/hooks';
import { materialsKeys } from '@tornotron/echno-core/materials/hooks/keys';
import type { Indent } from '@tornotron/echno-core/indents/types';
import type { Material } from '@tornotron/echno-core/materials/types';
import { useClearFormDraft } from '@/hooks/use-form-draft';
import { FORM_DRAFT_IDS } from '@/lib/forms/form-draft-ids';
import { useCreatePurchaseOrder } from '@tornotron/echno-core/purchase-orders/hooks';
import { useCurrentUserEmployee } from '@tornotron/echno-core/employee/hooks';
import type { InlinePurchaseOrderItemInput } from '@tornotron/echno-core/purchase-orders/types';
import {
  PurchaseOrderForm,
  PURCHASE_ORDER_FORM_ID,
  type POItemRow,
  type PurchaseOrderFormState,
  type PurchaseOrderSubmitData,
} from '@/features/purchase-orders/components';

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const fromIndentId = searchParams.get('fromIndent')
    ? Number(searchParams.get('fromIndent'))
    : undefined;

  const { data: currentEmployee } = useCurrentUserEmployee();
  const { data: sourceIndent } = useIndent(fromIndentId ?? 0);
  const { mutateAsync: createPO, isPending } = useCreatePurchaseOrder();
  const clearFormDraft = useClearFormDraft();

  // Read cache synchronously so navigation pre-fill works without waiting for an effect
  const cachedIndent = fromIndentId
    ? queryClient.getQueryData<Indent>(indentsKeys.detail(fromIndentId))
    : undefined;
  const cachedMaterials =
    queryClient.getQueryData<Material[]>(materialsKeys.lists()) ?? [];

  // Wait for indent to load when navigating from an indent page with no cache
  if (fromIndentId && !sourceIndent && !cachedIndent) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const resolvedIndent = sourceIndent ?? cachedIndent;

  const initialValues: Partial<PurchaseOrderFormState> = resolvedIndent
    ? { projectId: resolvedIndent.projectId || 0, indentId: resolvedIndent.id }
    : {};

  const initialItems: POItemRow[] | undefined = resolvedIndent?.items.length
    ? resolvedIndent.items.map((item) => {
        const mat = cachedMaterials.find((m) => m.id === item.material.id);
        return {
          materialId: item.material.id,
          materialName: item.material.materialName || mat?.materialName || '',
          indentItemId: item.id,
          orderedQuantity: item.requestedQuantity,
          unitPrice: 0,
          remarks: '',
        };
      })
    : undefined;

  async function handleSubmit(data: PurchaseOrderSubmitData) {
    if (!currentEmployee?.id) {
      toast.error('Unable to determine current user.');
      return;
    }
    try {
      const po = await createPO({
        poNumber: data.form.poNumber.trim(),
        vendorId: data.form.vendorId,
        projectId: data.form.projectId,
        indentId: data.form.indentId || undefined,
        status: data.form.status,
        createdBy: currentEmployee.id,
        expectedDeliveryDate: data.form.expectedDeliveryDate
          ? new Date(data.form.expectedDeliveryDate).toISOString()
          : undefined,
        remarks: data.form.remarks.trim() || undefined,
        totalAmount: data.totalAmount || undefined,
        items: data.items.map(
          (item): InlinePurchaseOrderItemInput => ({
            materialId: item.materialId,
            indentItemId: item.indentItemId,
            orderedQuantity: item.orderedQuantity,
            unitPrice: item.unitPrice || undefined,
            totalPrice: item.unitPrice
              ? item.orderedQuantity * item.unitPrice
              : undefined,
            remarks: item.remarks.trim() || undefined,
          })
        ),
      });
      // The record exists now, so the local draft describes work already done.
      // Left behind it would be offered on the next visit to this form.
      clearFormDraft(FORM_DRAFT_IDS.PURCHASE_ORDER);

      toast.success('Purchase Order Created', {
        description: 'The purchase order has been created successfully.',
      });
      router.push(routes.resources.purchaseOrders.detail(po.id).href);
    } catch (error) {
      toast.error(getErrorTitle(error, 'Failed to Create Purchase Order'), {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        sticky
        title="Create Purchase Order"
        description="Create a new vendor purchase order"
        actions={
          <>
            <Button variant="outline" disabled={isPending} asChild>
              <Link href={routes.resources.purchaseOrders.href}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              form={PURCHASE_ORDER_FORM_ID}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Purchase Order
                </>
              )}
            </Button>
          </>
        }
      />

      {sourceIndent && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <FolderOpen className="h-4 w-4 flex-shrink-0" />
          <span>
            Pre-filled from indent{' '}
            <Badge
              variant="outline"
              className="mx-1 border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300"
            >
              {sourceIndent.indentNumber}
            </Badge>
            — review quantities against current stock before creating.
          </span>
          <Link
            href={routes.resources.indents.detail(sourceIndent.id).href}
            className="ml-auto flex-shrink-0 font-medium underline-offset-2 hover:underline"
          >
            View indent
          </Link>
        </div>
      )}

      <PurchaseOrderForm
        initialValues={initialValues}
        initialItems={initialItems}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
