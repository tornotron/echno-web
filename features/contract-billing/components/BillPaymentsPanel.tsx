'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, FlaskConical } from 'lucide-react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  useAuthorizeBillPayment,
  useBillPayments,
  useRaiseBillPayment,
  useRecordBillPayment,
  useRejectBillPayment,
  useSyncBillPayment,
} from '@tornotron/echno-core/contract-billing/hooks';
import {
  BillPaymentProvider,
  type Bill,
  type BillPayment,
  type BillPayments,
} from '@tornotron/echno-core/contract-billing/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Skeleton } from '@/components/shadcn/skeleton';
import { Textarea } from '@/components/shadcn/textarea';
import { useCan } from '@/hooks/use-can';
import { toast } from '@/lib/styles/toast-styles';
import { BILLING_SIGN_ACCESS, PAYABLES_ACCESS } from '@/nav/access/roles';
import { routes } from '@/nav';
import { formatDate, formatDateTime, formatInr } from '../lib/format';
import {
  PROVIDER_NOTES,
  parsePaymentAmount,
  paymentActions,
  raiseBlockedReason,
} from '../lib/payments';
import { PaymentStateChip, PaymentStatusChip } from './chips';

function failed(title: string) {
  return (err: unknown) =>
    toast.error(getErrorTitle(err, title), {
      description: getErrorMessage(err),
    });
}

type Dialogue =
  | { kind: 'authorize'; payment: BillPayment }
  | { kind: 'reject'; payment: BillPayment }
  | { kind: 'record'; payment: BillPayment };

/**
 * Paying an approved bill: what is left to pay, raising a payment for the
 * second signature, and each attempt with what can be done to it next. The
 * figures are the payable's, so a payment recorded in Finance shows here too.
 */
export function BillPaymentsPanel({ bill }: { bill: Bill }) {
  const { data, isPending, isError, error } = useBillPayments(bill.id);
  const { allowed: canRaise } = useCan(BILLING_SIGN_ACCESS);
  const { allowed: canAuthorize } = useCan(PAYABLES_ACCESS);
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const sync = useSyncBillPayment();

  if (isPending) return <Skeleton className="h-64 w-full" />;
  if (isError || !data) {
    return (
      <p role="alert" className="text-destructive text-sm">
        Could not load the payments: {getErrorMessage(error)}
      </p>
    );
  }

  const figures = [
    { label: 'Net payable', value: formatInr(data.amountRecorded) },
    { label: 'Paid', value: formatInr(data.amountPaid) },
    { label: 'Due', value: formatInr(data.amountDue) },
  ];

  return (
    <div className="space-y-4">
      {data.provider === BillPaymentProvider.FAKE ? (
        <Alert>
          <FlaskConical className="h-4 w-4" />
          <AlertTitle>Test payments</AlertTitle>
          <AlertDescription>
            {PROVIDER_NOTES[BillPaymentProvider.FAKE]}
          </AlertDescription>
        </Alert>
      ) : (
        <p className="text-muted-foreground text-sm">
          {PROVIDER_NOTES[data.provider]}
        </p>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>What is left to pay</CardTitle>
          {data.paymentState && <PaymentStateChip state={data.paymentState} />}
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {figures.map((figure) => (
            <div key={figure.label}>
              <p className="text-muted-foreground text-xs">{figure.label}</p>
              <p className="text-lg font-semibold">{figure.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {canRaise && <RaisePayment bill={bill} view={data} />}

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {data.payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No payment has been raised on this bill.
            </p>
          ) : (
            <ul className="divide-y">
              {data.payments.map((payment) => (
                <PaymentRow
                  key={payment.id}
                  payment={payment}
                  canAuthorize={canAuthorize}
                  syncing={sync.isPending}
                  onSync={() =>
                    sync.mutate(payment.id, {
                      onSuccess: () => toast.success('Payment status updated'),
                      onError: failed('Could not check the payment'),
                    })
                  }
                  onDialogue={setDialogue}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {dialogue?.kind === 'authorize' && (
        <AuthorizeDialog
          payment={dialogue.payment}
          contractor={bill.contractorName}
          onClose={() => setDialogue(null)}
        />
      )}
      {dialogue?.kind === 'reject' && (
        <RejectDialog
          payment={dialogue.payment}
          onClose={() => setDialogue(null)}
        />
      )}
      {dialogue?.kind === 'record' && (
        <RecordDialog
          payment={dialogue.payment}
          onClose={() => setDialogue(null)}
        />
      )}
    </div>
  );
}

function RaisePayment({ bill, view }: { bill: Bill; view: BillPayments }) {
  const raise = useRaiseBillPayment();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const due = view.amountDue ?? 0;
  const blocked = raiseBlockedReason(view);

  if (blocked) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
        <span>
          {blocked}{' '}
          {view.provider !== BillPaymentProvider.MANUAL &&
            !view.beneficiaryReady && (
              <Link
                className="underline"
                href={routes.thirdParty.subContracts.href}
              >
                Go to sub-contracts
              </Link>
            )}
        </span>
      </p>
    );
  }

  const submit = () => {
    const parsed = parsePaymentAmount(amount || String(due), due);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setError(null);
    raise.mutate(
      {
        billId: bill.id,
        req: { amount: parsed.amount, note: note.trim() || undefined },
      },
      {
        onSuccess: () => {
          setAmount('');
          setNote('');
          toast.success('Payment raised for authorization');
        },
        onError: failed('Could not raise the payment'),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raise a payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="payment-amount">Amount</Label>
            <Input
              id="payment-amount"
              inputMode="decimal"
              placeholder={String(due)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Blank pays the {formatInr(due)} due. Less is a part payment.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="payment-note">Note (optional)</Label>
            <Textarea
              id="payment-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <Button onClick={submit} disabled={raise.isPending}>
          {raise.isPending ? 'Raising...' : 'Raise payment'}
        </Button>
      </CardContent>
    </Card>
  );
}

function PaymentRow({
  payment,
  canAuthorize,
  syncing,
  onSync,
  onDialogue,
}: {
  payment: BillPayment;
  canAuthorize: boolean;
  syncing: boolean;
  onSync: () => void;
  onDialogue: (dialogue: Dialogue) => void;
}) {
  const actions = paymentActions(payment, canAuthorize);
  const facts = [
    payment.requestedByName && `Raised by ${payment.requestedByName}`,
    formatDateTime(payment.requestedAt),
    payment.authorizedByName &&
      `Authorized by ${payment.authorizedByName}${
        payment.selfAuthorized ? ', who raised it' : ''
      }`,
  ].filter(Boolean);
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{formatInr(payment.amount)}</span>
          <PaymentStatusChip status={payment.status} />
          {payment.test && (
            <span className="text-muted-foreground text-xs">
              Test, no money moved
            </span>
          )}
        </p>
        <p className="text-muted-foreground text-xs">{facts.join(' · ')}</p>
        {payment.beneficiaryAccountLast4 && (
          <p className="text-muted-foreground text-xs">
            To {payment.beneficiaryName}, account ending{' '}
            {payment.beneficiaryAccountLast4}, {payment.beneficiaryIfsc}
          </p>
        )}
        {payment.bankReference && (
          <p className="text-sm">
            Reference {payment.bankReference}
            {payment.paidOn ? `, paid ${formatDate(payment.paidOn)}` : ''}
          </p>
        )}
        {payment.note && <p className="text-sm">{payment.note}</p>}
        {payment.failureReason && (
          <p className="text-destructive text-sm">{payment.failureReason}</p>
        )}
        {payment.lastError && (
          <p role="alert" className="text-destructive text-sm">
            {payment.lastError}
          </p>
        )}
        {payment.appliedAmount !== undefined &&
          payment.appliedAmount < payment.amount && (
            <p className="text-destructive text-sm">
              Only {formatInr(payment.appliedAmount)} went onto the payable.
              Finance has the difference to reconcile.
            </p>
          )}
      </div>
      {actions.length > 0 && (
        <div className="flex shrink-0 flex-wrap gap-2">
          {actions.includes('authorize') && (
            <Button
              size="sm"
              onClick={() => onDialogue({ kind: 'authorize', payment })}
            >
              Authorize
            </Button>
          )}
          {actions.includes('record') && (
            <Button
              size="sm"
              onClick={() => onDialogue({ kind: 'record', payment })}
            >
              Record as paid
            </Button>
          )}
          {actions.includes('sync') && (
            <Button
              size="sm"
              variant="outline"
              disabled={syncing}
              onClick={onSync}
            >
              {syncing ? 'Checking...' : 'Check status'}
            </Button>
          )}
          {actions.includes('reject') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDialogue({ kind: 'reject', payment })}
            >
              Reject
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

function AuthorizeDialog({
  payment,
  contractor,
  onClose,
}: {
  payment: BillPayment;
  contractor: string;
  onClose: () => void;
}) {
  const authorize = useAuthorizeBillPayment();
  const manual = payment.provider === BillPaymentProvider.MANUAL;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Authorize {formatInr(payment.amount)}</DialogTitle>
          <DialogDescription>
            {manual
              ? `This approves paying ${contractor}. You then pay from the bank and record the reference here.`
              : `This sends ${formatInr(payment.amount)} to ${contractor} through the provider straight away.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={authorize.isPending}
            onClick={() =>
              authorize.mutate(payment.id, {
                onSuccess: () => {
                  toast.success('Payment authorized');
                  onClose();
                },
                onError: failed('Could not authorize the payment'),
              })
            }
          >
            {authorize.isPending ? 'Authorizing...' : 'Authorize'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  payment,
  onClose,
}: {
  payment: BillPayment;
  onClose: () => void;
}) {
  const reject = useRejectBillPayment();
  const [reason, setReason] = useState('');
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject {formatInr(payment.amount)}</DialogTitle>
          <DialogDescription>
            Nothing is paid, and another payment can be raised.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="payment-reject-reason">Reason</Label>
          <Textarea
            id="payment-reject-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={reject.isPending || !reason.trim()}
            onClick={() =>
              reject.mutate(
                { paymentId: payment.id, text: reason.trim() },
                {
                  onSuccess: () => {
                    toast.success('Payment rejected');
                    onClose();
                  },
                  onError: failed('Could not reject the payment'),
                }
              )
            }
          >
            {reject.isPending ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecordDialog({
  payment,
  onClose,
}: {
  payment: BillPayment;
  onClose: () => void;
}) {
  const record = useRecordBillPayment();
  const [reference, setReference] = useState('');
  const [paidOn, setPaidOn] = useState(new Date().toLocaleDateString('en-CA'));
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record {formatInr(payment.amount)} as paid</DialogTitle>
          <DialogDescription>
            This records the payment on the payable.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="payment-reference">Bank reference</Label>
            <Input
              id="payment-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="payment-date">Paid on</Label>
            <Input
              id="payment-date"
              type="date"
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={record.isPending || !reference.trim() || !paidOn}
            onClick={() =>
              record.mutate(
                {
                  paymentId: payment.id,
                  req: { bankReference: reference.trim(), paidOn },
                },
                {
                  onSuccess: () => {
                    toast.success('Payment recorded');
                    onClose();
                  },
                  onError: failed('Could not record the payment'),
                }
              )
            }
          >
            {record.isPending ? 'Recording...' : 'Record as paid'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
