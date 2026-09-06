'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorMessage } from '@tornotron/echno-core';
import { useSiteTransfer } from '@tornotron/echno-core/site-transfers/hooks';
import type { SiteTransfer } from '@tornotron/echno-core/site-transfers/types';
import {
  inTransitMeaning,
  totalInTransit,
} from '@/lib/inventory/site-transfer-legs';
import {
  useCreateStockAdjustment,
  useStockAdjustment,
} from '@/hooks/stock-adjustments/use-stock-adjustments';
import type {
  StockAdjustment,
  StockAdjustmentLineItem,
} from '@/types/resource';
import {
  StockAdjustmentForm,
  STOCK_ADJUSTMENT_FORM_ID,
  type StockAdjustmentSubmitData,
} from '@/features/stock-adjustments/components';

/** A positive integer from a query parameter, or 0 when it is not one. */
function idParam(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/**
 * Builds the skeleton of an adjustment that closes a site transfer's variance.
 *
 * **The project and the storage location are the sending side's.** The transfer
 * drew the full sent quantity off the sending balance, while the receiving
 * balance was set by the count actually taken at the far end, so the sending
 * side is the only balance the transfer itself could have left wrong. It is a
 * starting point and nothing more: which site was wrong is a finding somebody
 * has to make on the ground, so every field this seeds stays editable and the
 * person can move the document onto the receiving site if that is where the
 * discrepancy turns out to be.
 *
 * No counted quantity is prefilled. A signed figure here would assert the
 * shortfall as a loss before anybody had counted the shelf, which is the same
 * automatic write-off the transfer deliberately refuses to make.
 *
 * @param transfer - The transfer whose variance is being closed.
 * @returns The seed for {@link StockAdjustmentForm}.
 */
function seedFromTransfer(transfer: SiteTransfer): Partial<StockAdjustment> {
  const shortfall = totalInTransit(transfer);
  const sendingSite = transfer.sendingProjectName ?? 'the sending site';
  const receivingSite = transfer.receivingProjectName ?? 'the receiving site';
  return {
    projectId: transfer.sendingProjectId,
    locationId: transfer.sendingStorageLocationId,
    justification:
      `Closes the ${shortfall} left unaccounted for on site transfer ` +
      `${transfer.transferNumber}: less arrived at ${receivingSite} than was ` +
      `sent from ${sendingSite}.`,
    sourceDocumentType: 'SITE_TRANSFER',
    sourceDocumentId: transfer.id,
    lineItems: transfer.items
      .filter((item) => item.inTransitQuantity > 0)
      .map((item, index) => ({
        id: index + 1,
        materialId: item.materialId,
        description: `${item.materialName}: ${item.inTransitQuantity} unaccounted for on ${transfer.transferNumber}`,
        systemQuantity: 0,
        physicalQuantity: 0,
        adjustmentQuantity: 0,
        unit: '',
        unitValue: 0,
        totalAdjustmentValue: 0,
        // Free text, the same as every other line reason this form submits:
        // `toPayload` sends whatever was typed into the reason box, and
        // `parseLineItem` casts whatever comes back. The enum on this field
        // describes an intention rather than the wire.
        reason:
          `Unaccounted for on site transfer ${transfer.transferNumber}` as StockAdjustmentLineItem['reason'],
        locationId: transfer.sendingStorageLocationId ?? 0,
      })),
  };
}

export default function CreateStockAdjustmentPage() {
  const router = useRouter();
  const createAdjustment = useCreateStockAdjustment();
  const searchParams = useSearchParams();

  // `?fromTransfer=<id>` raises the adjustment that closes a site transfer's
  // open variance. The transfer names the figure and says it stays open until
  // an adjustment closes it, and until now there was no route from one to the
  // other: the reference had nowhere to live on the payload, so a form filled
  // in from the transfer would have posted a document with no link back to it.
  const fromTransfer = idParam(searchParams.get('fromTransfer'));

  // `?from=<id>` raises a fresh draft carrying an existing adjustment's header
  // and lines. A rejection is terminal, so answering an objection means
  // retyping the whole count sheet unless the refused document can be copied.
  // The copy is a new document: it carries no rejection, and the adjustment
  // number is left for the form to generate because it has to be unique.
  const copyFrom = idParam(searchParams.get('from'));
  const copying = !fromTransfer && copyFrom > 0;

  const { data: source, isPending: sourcePending } = useStockAdjustment(
    copying ? copyFrom : 0
  );
  const { data: transfer, isPending: transferPending } = useSiteTransfer(
    fromTransfer || 0
  );

  // The one reading that leaves anything for an adjustment to close. A pending
  // or partly received transfer still has stock somebody may confirm, and a
  // cancelled one put its stock back on the sending balance; prefilling a
  // variance-closing document against either would be raising a correction for
  // a discrepancy that does not exist.
  const varianceOpen =
    !!transfer &&
    inTransitMeaning(transfer) === 'open-variance' &&
    totalInTransit(transfer) > 0;

  const initial = useMemo((): Partial<StockAdjustment> | undefined => {
    if (fromTransfer)
      return varianceOpen && transfer ? seedFromTransfer(transfer) : undefined;
    if (!copying || !source) return undefined;
    // A duplicate does NOT inherit the source reference. It is a new decision
    // about a different count, and carrying the provenance across would tell
    // the transfer that a second document closes it when that document was
    // raised to answer something else entirely. The copy takes the numbers and
    // leaves the paperwork behind, exactly as it already does with the
    // rejection and the adjustment number.
    return {
      ...source,
      adjustmentNumber: '',
      sourceDocumentType: undefined,
      sourceDocumentId: undefined,
    };
  }, [copying, fromTransfer, source, transfer, varianceOpen]);

  // The form seeds its state once, on first render, so anything raised from
  // another document has to wait for that document rather than mount blank and
  // never catch up.
  const waiting =
    (copying && sourcePending) || (fromTransfer > 0 && transferPending);
  const sourceMissing = copying && !sourcePending && !source;
  const transferMissing = fromTransfer > 0 && !transferPending && !transfer;
  const noOpenVariance = fromTransfer > 0 && !!transfer && !varianceOpen;

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

  function describe(): string {
    if (fromTransfer)
      return 'Raised to close a site transfer variance. Check every line before submitting.';
    if (copying)
      return 'Raised from an existing adjustment. Check every line before submitting.';
    return 'Record stock adjustments from physical counts or corrections';
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        sticky
        title="Create Stock Adjustment"
        description={describe()}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={routes.resources.stockAdjustments.href}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              form={STOCK_ADJUSTMENT_FORM_ID}
              disabled={
                createAdjustment.isPending ||
                waiting ||
                sourceMissing ||
                transferMissing
              }
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
      {waiting && (
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          {fromTransfer
            ? 'Loading the transfer this adjustment closes…'
            : 'Loading the adjustment this one is raised from…'}
        </div>
      )}
      {sourceMissing && (
        <p className="text-sm text-red-600 dark:text-red-400">
          The adjustment this one was to be raised from could not be loaded.
          Open it again from the list, or start a blank adjustment.
        </p>
      )}
      {transferMissing && (
        <p className="text-sm text-red-600 dark:text-red-400">
          The transfer this adjustment was to close could not be loaded. Open it
          again from the transfers list, or start a blank adjustment.
        </p>
      )}
      {noOpenVariance && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Site transfer {transfer?.transferNumber} has no open variance, so
          nothing has been filled in from it. A transfer still in transit may
          yet be received in full, and a cancelled one put its stock back on the
          sending site. Raise the adjustment below if you still need one.
        </p>
      )}
      {!waiting && !sourceMissing && !transferMissing && (
        <StockAdjustmentForm
          initial={initial}
          sourceLabel={fromTransfer ? transfer?.transferNumber : undefined}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
