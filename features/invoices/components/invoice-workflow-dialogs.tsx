'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/alert-dialog';
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

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  onConfirm: () => void;
  isPending: boolean;
}

export function SubmitInvoiceDialog({
  open,
  onOpenChange,
  invoiceNumber,
  onConfirm,
  isPending,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Submit for approval</AlertDialogTitle>
          <AlertDialogDescription>
            Submit invoice <strong>{invoiceNumber}</strong> for approval? It
            moves to Pending Approval and can no longer be edited as a draft.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ApproveInvoiceDialog({
  open,
  onOpenChange,
  invoiceNumber,
  onConfirm,
  isPending,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve invoice</AlertDialogTitle>
          <AlertDialogDescription>
            Approve invoice <strong>{invoiceNumber}</strong>? Approval posts the
            ledger journal entry and the invoice becomes payable.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Approve
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

export function CancelInvoiceDialog({
  open,
  onOpenChange,
  invoiceNumber,
  onConfirm,
  isPending,
}: CancelDialogProps) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();

  const handleOpenChange = (next: boolean) => {
    if (!next) setReason('');
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel invoice</DialogTitle>
          <DialogDescription>
            Cancel invoice <strong>{invoiceNumber}</strong>? A reversal journal
            entry is posted. A reason is required.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Reason</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this invoice being cancelled?"
            rows={3}
            disabled={isPending}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Keep invoice
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(trimmed)}
            disabled={isPending || trimmed.length === 0}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  balanceAmount: number;
  onConfirm: (amount: number) => void;
  isPending: boolean;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoiceNumber,
  balanceAmount,
  onConfirm,
  isPending,
}: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState('');
  const parsed = Number(amount);
  const isValid = amount.trim() !== '' && Number.isFinite(parsed) && parsed > 0;

  const handleOpenChange = (next: boolean) => {
    if (!next) setAmount('');
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Record a payment against invoice <strong>{invoiceNumber}</strong>.
            Outstanding balance: ₹{balanceAmount.toLocaleString('en-IN')}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="payment-amount">Amount</Label>
          <Input
            id="payment-amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={isPending}
          />
          {balanceAmount > 0 && (
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              onClick={() => setAmount(String(balanceAmount))}
              disabled={isPending}
            >
              Pay full balance
            </button>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(parsed)}
            disabled={isPending || !isValid}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
