'use client';

/**
 * The receiving site's statement of what came off the lorry.
 *
 * echno-backend#660 leaves a cross-project transfer's stock in transit until
 * this is filed. Three things about the form follow from the backend's design
 * rather than from taste:
 *
 * - **Each row is prefilled with what is still in transit**, not with what was
 *   sent. On a second delivery against a partly received transfer, prefilling
 *   the whole sent quantity would provoke the over-receipt refusal every time,
 *   which teaches people to click past it.
 * - **A shortfall is typed and sent with no ceremony.** There is no warning, no
 *   checkbox and no "write off the difference": eight against ten sent asserts
 *   nothing false, and the gap comes back on the transfer as an open variance
 *   for a stock adjustment to close.
 * - **An over-receipt is not guarded here.** A quantity above what is in
 *   transit is left to the server to refuse, and the refusal is answered in
 *   {@link TransferOverReceiptDialog}. An acknowledgement offered before the
 *   refusal is a guard people switch off.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { Loader2 } from 'lucide-react';
import type {
  SiteTransfer,
  ReceiveSiteTransferRequest,
} from '@tornotron/echno-core/site-transfers/types';

interface ReceiveTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: SiteTransfer;
  /** Files the receipt. The over-receipt refusal is handled by the caller. */
  onFile: (receipt: ReceiveSiteTransferRequest) => void;
  isPending: boolean;
}

/** One row of the form: a line, and the quantity being claimed for it. */
interface ReceiptRow {
  itemId: number;
  materialName: string;
  sentQuantity: number;
  /** What the transfer says is still outstanding on this line. */
  inTransitQuantity: number;
  /** Kept as a string so a cleared box is empty rather than reading zero. */
  entered: string;
}

/** Builds the rows, prefilled with what is still outstanding on each line. */
function rowsFor(transfer: SiteTransfer): ReceiptRow[] {
  return transfer.items.map((item) => ({
    itemId: item.id,
    materialName: item.materialName,
    sentQuantity: item.sentQuantity,
    inTransitQuantity: item.inTransitQuantity,
    entered: String(item.inTransitQuantity),
  }));
}

export function ReceiveTransferDialog({
  open,
  onOpenChange,
  transfer,
  onFile,
  isPending,
}: ReceiveTransferDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {/*
          Mounted only while open, and keyed on what the transfer currently
          says is outstanding. Both matter: reopening has to start from what
          the transfer says now rather than from what it said when the page
          loaded, because a colleague may have received against it since and a
          refused attempt has just dropped the cached copy on purpose. Doing it
          by remount rather than by resetting state in an effect keeps the
          initial values a plain `useState` initialiser.
        */}
        {open && (
          <ReceiptForm
            key={transfer.items
              .map((item) => `${item.id}:${item.inTransitQuantity}`)
              .join(',')}
            transfer={transfer}
            onOpenChange={onOpenChange}
            onFile={onFile}
            isPending={isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReceiptForm({
  transfer,
  onOpenChange,
  onFile,
  isPending,
}: Omit<ReceiveTransferDialogProps, 'open'>) {
  const [rows, setRows] = useState<ReceiptRow[]>(() => rowsFor(transfer));
  const [remarks, setRemarks] = useState('');

  const quantityOf = (row: ReceiptRow) => {
    const parsed = Number(row.entered);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };

  const anyBlank = rows.some((row) => row.entered.trim() === '');
  const anyInvalid = rows.some((row) => {
    const parsed = Number(row.entered);
    return !Number.isFinite(parsed) || parsed < 0;
  });

  function file() {
    onFile({
      ...(remarks.trim() === '' ? {} : { remarks: remarks.trim() }),
      items: rows.map((row) => ({
        itemId: row.itemId,
        receivedQuantity: quantityOf(row),
      })),
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Record what arrived</DialogTitle>
        <DialogDescription>
          Enter the quantity that came off the lorry for each material. This
          adds stock at the receiving site and is filed under your name.
          Recording less than was sent is fine: the difference stays open on the
          transfer.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.itemId}
            className="grid grid-cols-[1fr_7rem] items-end gap-3"
          >
            <div className="min-w-0">
              <Label htmlFor={`received-${row.itemId}`}>
                {row.materialName}
              </Label>
              <p className="text-muted-foreground mt-1 text-xs">
                {row.sentQuantity} sent, {row.inTransitQuantity} still in
                transit
              </p>
            </div>
            <Input
              id={`received-${row.itemId}`}
              type="number"
              min={0}
              value={row.entered}
              onChange={(event) => {
                const entered = event.target.value;
                setRows((current) =>
                  current.map((r, i) => (i === index ? { ...r, entered } : r))
                );
              }}
            />
          </div>
        ))}

        <div>
          <Label htmlFor="receipt-remarks">Note (optional)</Label>
          <Textarea
            id="receipt-remarks"
            value={remarks}
            maxLength={500}
            placeholder="Anything worth recording about the delivery"
            onChange={(event) => setRemarks(event.target.value)}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button onClick={file} disabled={isPending || anyBlank || anyInvalid}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Record delivery
        </Button>
      </DialogFooter>
    </>
  );
}
