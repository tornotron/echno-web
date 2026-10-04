'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  useCreateBill,
  useContractBilling,
} from '@tornotron/echno-core/contract-billing/hooks';
import { BillingModel } from '@tornotron/echno-core/contract-billing/types';
import { Button } from '@/components/shadcn/button';
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
import { toast } from '@/lib/styles/toast-styles';
import { routes } from '@/nav';
import { formatInr, formatPercent, parseAmountInput } from '../lib/format';
import { MODEL_LABELS } from '../lib/labels';
import { SELECT_CLASS } from './chips';

interface NewBillDialogProps {
  subContractId: number;
  contractName: string;
  /** Fixed when the contract is already billed; absent when billing starts and the user chooses. */
  model?: BillingModel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function firstOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString(
    'en-CA'
  );
}

function lastOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString(
    'en-CA'
  );
}

/**
 * Opens a bill on a contract. When billing has not started, the user picks
 * Running Account or Milestone here, and that choice holds for the contract.
 * An RA bill needs its billing period; a milestone bill needs its milestone.
 */
export function NewBillDialog({
  subContractId,
  contractName,
  model,
  open,
  onOpenChange,
}: NewBillDialogProps) {
  const router = useRouter();
  const createBill = useCreateBill();
  const { data: contract } = useContractBilling(
    open ? subContractId : undefined
  );
  const [chosen, setChosen] = useState<BillingModel>(
    model ?? BillingModel.RUNNING_ACCOUNT
  );
  const [periodFrom, setPeriodFrom] = useState(firstOfMonth());
  const [periodTo, setPeriodTo] = useState(lastOfMonth());
  const [milestoneId, setMilestoneId] = useState('');
  const [claimedPercent, setClaimedPercent] = useState('');
  const [contractorReference, setContractorReference] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const billingModel = model ?? chosen;
  const milestones = (contract?.milestones ?? []).filter(
    (m) => m.certifiedPercent < 100
  );
  const boqCount = contract?.boqItems.length ?? 0;

  const submit = () => {
    setError(null);
    let percent: number | undefined;
    if (billingModel === BillingModel.MILESTONE) {
      if (!milestoneId) {
        setError('Choose the milestone this bill is for.');
        return;
      }
      const parsed = parseAmountInput(claimedPercent);
      if (
        parsed === undefined ||
        (parsed !== null && (parsed <= 0 || parsed > 100))
      ) {
        setError(
          'Enter a claimed percent above 0 and up to 100, or leave it blank.'
        );
        return;
      }
      percent = parsed ?? undefined;
    } else if (!periodFrom || !periodTo) {
      setError('Enter the first and last day of the billing period.');
      return;
    }
    createBill.mutate(
      {
        subContractId,
        billingModel,
        periodFrom:
          billingModel === BillingModel.RUNNING_ACCOUNT
            ? periodFrom
            : undefined,
        periodTo:
          billingModel === BillingModel.RUNNING_ACCOUNT ? periodTo : undefined,
        contractMilestoneId:
          billingModel === BillingModel.MILESTONE
            ? Number(milestoneId)
            : undefined,
        claimedPercent: percent,
        contractorReference: contractorReference.trim() || undefined,
        location: location.trim() || undefined,
      },
      {
        onSuccess: (bill) => {
          toast.success(`Bill ${bill.billNumber} opened as a draft`);
          onOpenChange(false);
          router.push(routes.finance.billing.bills.detail(bill.id).href);
        },
        onError: (err) =>
          toast.error(getErrorTitle(err, 'Could not open the bill'), {
            description: getErrorMessage(err),
          }),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {model ? `New ${MODEL_LABELS[model]} bill` : 'Start billing'}
          </DialogTitle>
          <DialogDescription>{contractName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!model && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                How is this contract billed?
              </legend>
              {[BillingModel.RUNNING_ACCOUNT, BillingModel.MILESTONE].map(
                (option) => (
                  <label
                    key={option}
                    className="flex items-start gap-2 rounded-md border p-3 text-sm"
                  >
                    <input
                      type="radio"
                      name="billing-model"
                      className="mt-1"
                      checked={chosen === option}
                      onChange={() => setChosen(option)}
                    />
                    <span>
                      <span className="font-medium">
                        {MODEL_LABELS[option]}
                      </span>
                      <span className="text-muted-foreground block">
                        {option === BillingModel.RUNNING_ACCOUNT
                          ? 'Monthly bills of quantities measured against the contract BOQ.'
                          : 'Bills against a contract milestone, as a percent of its value.'}
                      </span>
                    </span>
                  </label>
                )
              )}
              <p className="text-muted-foreground text-xs">
                The first bill fixes the model for this contract.
              </p>
            </fieldset>
          )}

          {billingModel === BillingModel.RUNNING_ACCOUNT ? (
            <>
              {contract && boqCount === 0 && (
                <p role="alert" className="text-destructive text-sm">
                  This contract has no BOQ yet. Add its BOQ items on the
                  contract&apos;s billing page first.
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="period-from">Period from</Label>
                  <Input
                    id="period-from"
                    type="date"
                    value={periodFrom}
                    onChange={(e) => setPeriodFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="period-to">Period to</Label>
                  <Input
                    id="period-to"
                    type="date"
                    value={periodTo}
                    onChange={(e) => setPeriodTo(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <Label htmlFor="milestone">Milestone</Label>
                <select
                  id="milestone"
                  className={SELECT_CLASS}
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                >
                  <option value="">Choose a milestone</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({formatInr(m.value)},{' '}
                      {formatPercent(m.certifiedPercent)} certified)
                    </option>
                  ))}
                </select>
                {contract && milestones.length === 0 && (
                  <p className="text-destructive text-sm">
                    No milestone is left to bill. Add milestones with an amount
                    or payment percentage on the sub-contract.
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="claimed-percent">
                  Claimed percent of the milestone value (optional)
                </Label>
                <Input
                  id="claimed-percent"
                  inputMode="decimal"
                  value={claimedPercent}
                  onChange={(e) => setClaimedPercent(e.target.value)}
                  placeholder="85"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="contractor-ref">
                Contractor&apos;s bill no. (optional)
              </Label>
              <Input
                id="contractor-ref"
                value={contractorReference}
                onChange={(e) => setContractorReference(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="bill-location">Location (optional)</Label>
              <Input
                id="bill-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Tower B, level 2"
              />
            </div>
          </div>
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={createBill.isPending}>
            {createBill.isPending ? 'Opening...' : 'Open bill'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
