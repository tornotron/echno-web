'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Send,
  CheckCircle2,
  Wallet,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import {
  ConstructionInvoice,
  ConstructionInvoiceStatus,
} from '@/types/finance/invoice';
import { routes } from '@/nav';
import { useInvoiceWorkflow } from '@/features/invoices/hooks/use-invoice-workflow';
import {
  SubmitInvoiceDialog,
  ApproveInvoiceDialog,
  CancelInvoiceDialog,
  RecordPaymentDialog,
} from './invoice-workflow-dialogs';

type ActiveDialog = 'submit' | 'approve' | 'cancel' | 'payment' | null;

interface InvoiceActionsProps {
  invoice: ConstructionInvoice;
  /** `menu` renders a row dropdown (list); `buttons` renders inline (detail). */
  variant: 'menu' | 'buttons';
}

export function InvoiceActions({ invoice, variant }: InvoiceActionsProps) {
  const router = useRouter();
  const [active, setActive] = useState<ActiveDialog>(null);
  const {
    canManage,
    submit,
    approve,
    cancel,
    recordPayment,
    isSubmitting,
    isApproving,
    isCancelling,
    isRecordingPayment,
  } = useInvoiceWorkflow();

  const close = () => setActive(null);

  const canSubmit =
    canManage && invoice.status === ConstructionInvoiceStatus.DRAFT;
  const canApprove =
    canManage && invoice.status === ConstructionInvoiceStatus.PENDING;
  const canRecordPayment =
    canManage &&
    invoice.status === ConstructionInvoiceStatus.APPROVED &&
    invoice.balanceAmount > 0;
  const canCancel =
    canManage && invoice.status === ConstructionInvoiceStatus.APPROVED;

  const hasWorkflowAction =
    canSubmit || canApprove || canRecordPayment || canCancel;

  const detailHref = routes.finance.invoices.detail(invoice.id).href;
  const editHref = routes.finance.invoices.detail(invoice.id).edit;

  const dialogs = (
    <>
      <SubmitInvoiceDialog
        open={active === 'submit'}
        onOpenChange={(open) => !open && close()}
        invoiceNumber={invoice.invoiceNumber}
        isPending={isSubmitting}
        onConfirm={() => submit(invoice.id, { onDone: close })}
      />
      <ApproveInvoiceDialog
        open={active === 'approve'}
        onOpenChange={(open) => !open && close()}
        invoiceNumber={invoice.invoiceNumber}
        isPending={isApproving}
        onConfirm={() => approve(invoice.id, { onDone: close })}
      />
      <CancelInvoiceDialog
        open={active === 'cancel'}
        onOpenChange={(open) => !open && close()}
        invoiceNumber={invoice.invoiceNumber}
        isPending={isCancelling}
        onConfirm={(reason) => cancel(invoice.id, reason, { onDone: close })}
      />
      <RecordPaymentDialog
        open={active === 'payment'}
        onOpenChange={(open) => !open && close()}
        invoiceNumber={invoice.invoiceNumber}
        balanceAmount={invoice.balanceAmount}
        isPending={isRecordingPayment}
        onConfirm={(amount) =>
          recordPayment(invoice.id, amount, { onDone: close })
        }
      />
    </>
  );

  if (variant === 'buttons') {
    return (
      <>
        {canSubmit && (
          <Button variant="outline" onClick={() => setActive('submit')}>
            <Send className="mr-2 h-4 w-4" />
            Submit for Approval
          </Button>
        )}
        {canApprove && (
          <Button onClick={() => setActive('approve')}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Approve
          </Button>
        )}
        {canRecordPayment && (
          <Button onClick={() => setActive('payment')}>
            <Wallet className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        )}
        {canCancel && (
          <Button variant="outline" onClick={() => setActive('cancel')}>
            <Ban className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}
        {dialogs}
      </>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Invoice actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(detailHref)}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={editHref}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
          {hasWorkflowAction && <DropdownMenuSeparator />}
          {canSubmit && (
            <DropdownMenuItem onClick={() => setActive('submit')}>
              <Send className="mr-2 h-4 w-4" />
              Submit for Approval
            </DropdownMenuItem>
          )}
          {canApprove && (
            <DropdownMenuItem onClick={() => setActive('approve')}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </DropdownMenuItem>
          )}
          {canRecordPayment && (
            <DropdownMenuItem onClick={() => setActive('payment')}>
              <Wallet className="mr-2 h-4 w-4" />
              Record Payment
            </DropdownMenuItem>
          )}
          {canCancel && (
            <DropdownMenuItem
              onClick={() => setActive('cancel')}
              className="text-red-600 dark:text-red-400"
            >
              <Ban className="mr-2 h-4 w-4" />
              Cancel
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {dialogs}
    </div>
  );
}
