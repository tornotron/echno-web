'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Download,
  FileCheck2,
} from 'lucide-react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { contractBillingService } from '@tornotron/echno-core/contract-billing/services';
import {
  useBill,
  useBillStep,
  useReturnBill,
  useSaveBillMeasurement,
  useUpdateBill,
  type BillStep,
} from '@tornotron/echno-core/contract-billing/hooks';
import {
  BillStatus,
  BillingModel,
  type Bill,
} from '@tornotron/echno-core/contract-billing/types';
import { PageHeader } from '@/components/common';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
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
import { Button } from '@/components/shadcn/button';
import { Card, CardContent } from '@/components/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import {
  Empty,
  EmptyDescription,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
} from '@/components/shadcn/empty';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import { Textarea } from '@/components/shadcn/textarea';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils/index';
import { toast } from '@/lib/styles/toast-styles';
import { triggerBlobDownload } from '@/lib/utils/download';
import { BILL_PREPARE_ACCESS, BILLING_SIGN_ACCESS } from '@/nav/access/roles';
import { routes } from '@/nav';
import { billActions, stepperSteps, type BillAction } from '../lib/actions';
import { formatDate, formatInr } from '../lib/format';
import { MODEL_LABELS, billTitle } from '../lib/labels';
import {
  buildClaimRequest,
  buildMeasurementRequest,
  claimHeaderOf,
  measurementFormOf,
  type ClaimHeader,
  type MeasurementForm,
} from '../lib/requests';
import { BillAdjustments } from './BillAdjustments';
import { BillDocuments } from './BillDocuments';
import { BillMilestone } from './BillMilestone';
import { BillOverview } from './BillOverview';
import { BillQuantities } from './BillQuantities';
import { BillTimeline } from './BillTimeline';
import { BillStatusChip } from './chips';

function failed(title: string) {
  return (err: unknown) =>
    toast.error(getErrorTitle(err, title), {
      description: getErrorMessage(err),
    });
}

/** A running account or milestone bill, its figures and its workflow. */
export function BillView({ billId }: { billId: string }) {
  const { data: bill, isPending, isError, error } = useBill(billId);

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (isError || !bill) {
    return (
      <Empty variant="error">
        <EmptyErrorMedia>
          <FileCheck2 className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Could not load the bill</EmptyTitle>
          <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  // Keyed on the last change so the claim and measurement forms start from
  // what the server holds after every save.
  return (
    <BillWorkspace
      key={`${bill.id}-${bill.updatedAt ?? ''}-${bill.status}`}
      bill={bill}
    />
  );
}

type Confirm = Extract<BillStep, 'cancel' | 'certify' | 'approve'>;

function BillWorkspace({ bill }: { bill: Bill }) {
  const { allowed: prepare } = useCan(BILL_PREPARE_ACCESS);
  const { allowed: sign } = useCan(BILLING_SIGN_ACCESS);
  const actions = billActions(bill.status, { prepare, sign });
  const can = (action: BillAction) => actions.has(action);

  const [header, setHeader] = useState<ClaimHeader>(() => claimHeaderOf(bill));
  const [claims, setClaims] = useState<Record<string, string>>({});
  const [measurement, setMeasurement] = useState<MeasurementForm>(() =>
    measurementFormOf(bill)
  );
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [returning, setReturning] = useState(false);
  const [reason, setReason] = useState('');
  const [downloading, setDownloading] = useState(false);

  const updateBill = useUpdateBill();
  const saveMeasurement = useSaveBillMeasurement();
  const step = useBillStep();
  const returnBill = useReturnBill();
  const busy =
    updateBill.isPending ||
    saveMeasurement.isPending ||
    step.isPending ||
    returnBill.isPending;

  const saveClaim = async (): Promise<boolean> => {
    const built = buildClaimRequest(bill, header, claims);
    if (!built.ok) {
      toast.error('Check the claim', { description: built.error });
      return false;
    }
    try {
      await updateBill.mutateAsync({ id: bill.id, req: built.request });
      return true;
    } catch (error) {
      failed('Could not save the claim')(error);
      return false;
    }
  };

  const saveMeasured = async (): Promise<boolean> => {
    const built = buildMeasurementRequest(bill, measurement);
    if (!built.ok) {
      toast.error('Check the measurement', { description: built.error });
      return false;
    }
    try {
      await saveMeasurement.mutateAsync({ id: bill.id, req: built.request });
      return true;
    } catch (error) {
      failed('Could not save the measurement')(error);
      return false;
    }
  };

  const run = async (name: BillStep, done: string, title: string) => {
    try {
      await step.mutateAsync({ id: bill.id, step: name });
      toast.success(done);
    } catch (error) {
      failed(title)(error);
    }
  };

  const onSaveClaim = async () => {
    if (await saveClaim()) toast.success('Claim saved');
  };
  const claimDirty =
    Object.keys(claims).length > 0 ||
    JSON.stringify(header) !== JSON.stringify(claimHeaderOf(bill));
  const measurementDirty =
    JSON.stringify(measurement) !== JSON.stringify(measurementFormOf(bill));

  const onSubmit = async () => {
    if (!claimDirty || (await saveClaim()))
      await run(
        'submit',
        `Bill ${bill.billNumber} submitted for joint measurement`,
        'Could not submit the bill'
      );
  };
  const onSaveMeasurement = async () => {
    if (await saveMeasured()) toast.success('Measurement saved');
  };
  const onVerify = async () => {
    if (!measurementDirty || (await saveMeasured()))
      await run(
        'verify',
        `Bill ${bill.billNumber} verified`,
        'Could not verify the bill'
      );
  };
  const onConfirm = async () => {
    const which = confirm;
    setConfirm(null);
    if (which === 'cancel')
      await run(
        'cancel',
        `Bill ${bill.billNumber} cancelled`,
        'Could not cancel the bill'
      );
    if (which === 'certify')
      await run(
        'certify',
        `Bill ${bill.billNumber} certified`,
        'Could not certify the bill'
      );
    if (which === 'approve')
      await run(
        'approve',
        `Bill ${bill.billNumber} approved and handed to finance`,
        'Could not approve the bill'
      );
  };
  const onReturn = () => {
    if (!reason.trim()) {
      toast.error('Say why the bill is going back');
      return;
    }
    returnBill.mutate(
      { id: bill.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(`Bill ${bill.billNumber} returned for correction`);
          setReturning(false);
          setReason('');
        },
        onError: failed('Could not return the bill'),
      }
    );
  };
  const onDownload = async () => {
    setDownloading(true);
    try {
      const blob = await contractBillingService.downloadPdf(bill.id);
      triggerBlobDownload(
        blob,
        `${bill.contractRef ? `${bill.contractRef}-` : ''}${bill.billNumber}.pdf`
      );
    } catch (error) {
      failed('Could not download the PDF')(error);
    } finally {
      setDownloading(false);
    }
  };

  const ra = bill.billingModel === BillingModel.RUNNING_ACCOUNT;
  const subtitle = [
    bill.contractName,
    bill.contractorName,
    bill.projectName,
    ra
      ? `${formatDate(bill.periodFrom)} to ${formatDate(bill.periodTo)}`
      : bill.milestoneName,
    bill.location,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={billTitle(bill)}
        description={subtitle}
        actions={
          <>
            <Button asChild variant="outline">
              <Link
                href={
                  routes.finance.billing.contracts.detail(bill.subContractId)
                    .href
                }
              >
                <ArrowLeft className="size-4" />
                Contract
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={onDownload}
              disabled={downloading}
            >
              <Download className="size-4" />
              {downloading ? 'Preparing...' : 'PDF'}
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <BillStatusChip status={bill.status} />
            <span className="rounded-full border px-2 py-0.5 text-xs">
              {MODEL_LABELS[bill.billingModel]}
            </span>
            {!bill.amountsFinal && bill.status !== BillStatus.CANCELLED && (
              <span className="text-muted-foreground text-xs">
                Figures are provisional until certification
              </span>
            )}
            <div className="ml-auto text-right">
              <p className="text-xl font-semibold">
                {formatInr(bill.netPayable)}
              </p>
              <p className="text-muted-foreground text-xs">Net payable</p>
            </div>
          </div>
          <Stepper bill={bill} />
          <div className="flex flex-wrap gap-2" data-testid="bill-actions">
            {can('saveClaim') && (
              <Button variant="outline" onClick={onSaveClaim} disabled={busy}>
                Save claim
              </Button>
            )}
            {can('submit') && (
              <Button onClick={onSubmit} disabled={busy}>
                Submit for measurement
              </Button>
            )}
            {can('saveMeasurement') && (
              <Button
                variant="outline"
                onClick={onSaveMeasurement}
                disabled={busy}
              >
                Save measurement
              </Button>
            )}
            {can('verify') && (
              <Button onClick={onVerify} disabled={busy}>
                Verify
              </Button>
            )}
            {can('certify') && (
              <Button onClick={() => setConfirm('certify')} disabled={busy}>
                Certify
              </Button>
            )}
            {can('approve') && (
              <Button onClick={() => setConfirm('approve')} disabled={busy}>
                Give final approval
              </Button>
            )}
            {can('return') && (
              <Button
                variant="outline"
                onClick={() => setReturning(true)}
                disabled={busy}
              >
                Return for correction
              </Button>
            )}
            {can('cancel') && (
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => setConfirm('cancel')}
                disabled={busy}
              >
                Cancel bill
              </Button>
            )}
            {actions.size === 0 &&
              bill.status !== BillStatus.APPROVED &&
              bill.status !== BillStatus.CANCELLED && (
                <p className="text-muted-foreground text-sm">
                  The next step on this bill is for someone with another role.
                </p>
              )}
          </div>
        </CardContent>
      </Card>

      {bill.status === BillStatus.RETURNED && bill.returnReason && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Returned for correction</AlertTitle>
          <AlertDescription>{bill.returnReason}</AlertDescription>
        </Alert>
      )}
      {bill.status === BillStatus.APPROVED && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertTitle>Approved and handed to finance</AlertTitle>
          <AlertDescription>
            {bill.payableId ? (
              <>
                A payable of {formatInr(bill.netPayable)} was raised for{' '}
                {bill.contractorName}.{' '}
                <Link className="underline" href={routes.finance.payables}>
                  Open payables
                </Link>
              </>
            ) : (
              'Nothing was payable on this bill, so no payable was raised.'
            )}
            {bill.selfApproved &&
              ' Approved by the same system admin who certified it.'}
          </AlertDescription>
        </Alert>
      )}
      {bill.status === BillStatus.CANCELLED && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cancelled</AlertTitle>
          <AlertDescription>
            This bill was cancelled. Its number is not reused.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {ra ? (
            <TabsTrigger value="quantities">Claimed quantities</TabsTrigger>
          ) : (
            <TabsTrigger value="milestone">Milestone</TabsTrigger>
          )}
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
          <TabsTrigger value="documents">Supporting documents</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <BillOverview
            bill={bill}
            header={header}
            onHeaderChange={setHeader}
            editable={can('saveClaim')}
            measurement={measurement}
            onMeasurementChange={setMeasurement}
            measuring={can('saveMeasurement')}
          />
        </TabsContent>
        {ra ? (
          <TabsContent value="quantities">
            <BillQuantities
              bill={bill}
              claims={claims}
              onClaimsChange={setClaims}
              claiming={can('saveClaim')}
              measurement={measurement}
              onMeasurementChange={setMeasurement}
              measuring={can('saveMeasurement')}
            />
          </TabsContent>
        ) : (
          <TabsContent value="milestone">
            <BillMilestone
              bill={bill}
              header={header}
              onHeaderChange={setHeader}
              claiming={can('saveClaim')}
              measurement={measurement}
              onMeasurementChange={setMeasurement}
              measuring={can('saveMeasurement')}
            />
          </TabsContent>
        )}
        <TabsContent value="adjustments">
          <BillAdjustments bill={bill} editable={can('editAdjustments')} />
        </TabsContent>
        <TabsContent value="documents">
          <BillDocuments bill={bill} editable={can('documents')} />
        </TabsContent>
        <TabsContent value="timeline">
          <BillTimeline bill={bill} canNote={prepare} />
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === 'cancel' && `Cancel bill ${bill.billNumber}?`}
              {confirm === 'certify' && `Certify bill ${bill.billNumber}?`}
              {confirm === 'approve' &&
                `Give final approval to bill ${bill.billNumber}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'cancel' &&
                'A cancelled bill cannot be reopened. Open a new bill if this one was raised in error.'}
              {confirm === 'certify' &&
                `Certification applies the contract's deduction rules and freezes every figure on the bill. The net payable shown now is ${formatInr(bill.netPayable)}.`}
              {confirm === 'approve' &&
                `Approval hands ${formatInr(bill.netPayable)} to finance as a payable for ${bill.contractorName}. The person who certified the bill cannot approve it, unless a system admin.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>
              {confirm === 'cancel'
                ? 'Cancel bill'
                : confirm === 'certify'
                  ? 'Certify'
                  : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={returning} onOpenChange={setReturning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Return bill {bill.billNumber} for correction
            </DialogTitle>
            <DialogDescription>
              The preparer can change the claim and submit it again.
              {bill.status === BillStatus.CERTIFIED &&
                ' Its certified figures are unfrozen and kept on the timeline.'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            aria-label="Reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide additional shuttering photos for B2-04."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturning(false)}>
              Go back
            </Button>
            <Button onClick={onReturn} disabled={returnBill.isPending}>
              Return bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stepper({ bill }: { bill: Bill }) {
  const steps = stepperSteps(bill);
  return (
    <ol className="grid grid-cols-5 gap-2" aria-label="Bill progress">
      {steps.map((s) => (
        <li
          key={s.label}
          className="flex flex-col items-center gap-1 text-center"
        >
          <span
            className={cn(
              'flex size-7 items-center justify-center rounded-full border-2 text-xs',
              s.state === 'done' && 'border-blue-600 bg-blue-600 text-white',
              s.state === 'current' && 'border-blue-600 text-blue-600',
              s.state === 'upcoming' && 'border-zinc-300 text-zinc-400'
            )}
            aria-current={s.state === 'current' ? 'step' : undefined}
          >
            {s.state === 'done' ? <Check className="size-4" /> : null}
          </span>
          <span className="text-xs font-medium">{s.label}</span>
          <span className="text-muted-foreground text-[11px]">
            {s.at ? formatDate(s.at) : ''}
          </span>
        </li>
      ))}
    </ol>
  );
}
