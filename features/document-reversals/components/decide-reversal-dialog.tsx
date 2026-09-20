'use client';

/**
 * The approver's two decisions on a pending reversal request. Approval is a
 * confirmation; rejection asks for the reason, which the server requires.
 */
import { useState } from 'react';
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
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { Loader2 } from 'lucide-react';
import type { DocumentReversal } from '@tornotron/echno-core/document-reversals/types';
import { reversibleDocumentTypeLabels } from '@tornotron/echno-core/document-reversals/types';

export type ReversalDecision = 'approve' | 'reject';

interface DecideReversalDialogProps {
  reversal: DocumentReversal | null;
  decision: ReversalDecision | null;
  onOpenChange: (open: boolean) => void;
  onApprove: (reversal: DocumentReversal) => void;
  onReject: (reversal: DocumentReversal, reason: string) => void;
  isPending: boolean;
}

export function DecideReversalDialog({
  reversal,
  decision,
  onOpenChange,
  onApprove,
  onReject,
  isPending,
}: DecideReversalDialogProps) {
  const open = reversal !== null && decision !== null;
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isPending && !next) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        {open && decision === 'approve' && (
          <ApproveForm
            reversal={reversal}
            onApprove={onApprove}
            isPending={isPending}
          />
        )}
        {open && decision === 'reject' && (
          <RejectForm
            reversal={reversal}
            onReject={onReject}
            isPending={isPending}
          />
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function describe(reversal: DocumentReversal): string {
  return `${reversibleDocumentTypeLabels[reversal.documentType].toLowerCase()} ${reversal.documentNumber}`;
}

function ApproveForm({
  reversal,
  onApprove,
  isPending,
}: {
  reversal: DocumentReversal;
  onApprove: (reversal: DocumentReversal) => void;
  isPending: boolean;
}) {
  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Approve this reversal</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div className="space-y-3">
            <p>
              {describe(reversal)} will be undone. Every store it moved stock
              through returns to the balance it held before, the store keepers
              are told to put the physical stock back, and the document stays on
              record marked reversed.
            </p>
            <p className="text-muted-foreground">
              Requested by {reversal.requestedByName ?? 'the creator'}:{' '}
              {reversal.reason}
            </p>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>Not now</AlertDialogCancel>
        <AlertDialogAction
          onClick={(event) => {
            event.preventDefault();
            onApprove(reversal);
          }}
          disabled={isPending}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Approve and undo it
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}

function RejectForm({
  reversal,
  onReject,
  isPending,
}: {
  reversal: DocumentReversal;
  onReject: (reversal: DocumentReversal, reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState('');
  const reasonGiven = reason.trim().length > 0;
  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Reject this reversal</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div className="space-y-3">
            <p>
              {describe(reversal)} stays as it is. Nothing moves. The refusal
              and your reason stay on the request, and the requester is told.
            </p>
            <p className="text-muted-foreground">
              Requested by {reversal.requestedByName ?? 'the creator'}:{' '}
              {reversal.reason}
            </p>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div>
        <Label htmlFor="reversal-rejection-reason">Reason</Label>
        <Textarea
          id="reversal-rejection-reason"
          value={reason}
          maxLength={500}
          placeholder="Why the reversal is refused"
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>Back</AlertDialogCancel>
        <AlertDialogAction
          onClick={(event) => {
            event.preventDefault();
            onReject(reversal, reason.trim());
          }}
          disabled={isPending || !reasonGiven}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reject
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}
