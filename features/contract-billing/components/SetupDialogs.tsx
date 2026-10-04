'use client';

import { useState } from 'react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  useAddBoqItem,
  useAddDeductionRule,
  useAddMilestoneRequirement,
  useUpdateBoqItem,
  useUpdateDeductionRule,
  useUpdateMilestoneRequirement,
} from '@tornotron/echno-core/contract-billing/hooks';
import {
  AdjustmentEffect,
  DeductionBasis,
  DeductionKind,
  RequirementStatus,
  RequirementType,
  type BoqItem,
  type DeductionRule,
  type MilestoneRequirement,
} from '@tornotron/echno-core/contract-billing/types';
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
import { Textarea } from '@/components/shadcn/textarea';
import { toast } from '@/lib/styles/toast-styles';
import { parseAmountInput } from '../lib/format';
import {
  ADDING_KINDS,
  KIND_LABELS,
  REQUIREMENT_STATUS_LABELS,
  REQUIREMENT_TYPE_LABELS,
} from '../lib/labels';
import { SELECT_CLASS } from './chips';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function failed(title: string) {
  return (err: unknown) =>
    toast.error(getErrorTitle(err, title), {
      description: getErrorMessage(err),
    });
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------- BOQ item

export function BoqItemDialog({
  subContractId,
  item,
  open,
  onOpenChange,
}: DialogProps & { subContractId: number; item?: BoqItem }) {
  const add = useAddBoqItem();
  const update = useUpdateBoqItem();
  const [code, setCode] = useState(item?.itemCode ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [unit, setUnit] = useState(item?.unit ?? '');
  const [quantity, setQuantity] = useState(
    item ? String(item.contractQuantity) : ''
  );
  const [rate, setRate] = useState(item ? String(item.rate) : '');
  const [error, setError] = useState<string | null>(null);
  const pending = add.isPending || update.isPending;

  const save = () => {
    const qty = parseAmountInput(quantity);
    const price = parseAmountInput(rate);
    if (!code.trim() || !description.trim() || !unit.trim()) {
      setError('Enter the item code, description and unit.');
      return;
    }
    if (qty === undefined || qty === null || qty <= 0) {
      setError('Enter a contract quantity above zero.');
      return;
    }
    if (price === undefined || price === null) {
      setError('Enter the rate in rupees.');
      return;
    }
    const req = {
      itemCode: code.trim(),
      description: description.trim(),
      unit: unit.trim(),
      contractQuantity: qty,
      rate: price,
      wbsElementId: item?.wbsElementId,
      sortOrder: item?.sortOrder,
    };
    const done = {
      onSuccess: () => {
        toast.success(
          item ? `Item ${req.itemCode} saved` : `Item ${req.itemCode} added`
        );
        onOpenChange(false);
      },
      onError: failed(
        item ? 'Could not save the item' : 'Could not add the item'
      ),
    };
    if (item) update.mutate({ itemId: item.id, req }, done);
    else add.mutate({ subContractId, req }, done);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {item ? `Edit BOQ item ${item.itemCode}` : 'Add BOQ item'}
          </DialogTitle>
          <DialogDescription>
            Bills already opened keep the code, quantity and rate they copied
            from the BOQ.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field id="boq-code" label="Item code">
            <Input
              id="boq-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="CP-01"
            />
          </Field>
          <Field id="boq-unit" label="Unit">
            <Input
              id="boq-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="m3"
            />
          </Field>
          <div className="col-span-2">
            <Field id="boq-description" label="Description">
              <Textarea
                id="boq-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="RCC in foundation (M25)"
              />
            </Field>
          </div>
          <Field id="boq-qty" label="Contract quantity">
            <Input
              id="boq-qty"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
          <Field id="boq-rate" label="Rate (₹ per unit)">
            <Input
              id="boq-rate"
              inputMode="decimal"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </Field>
        </div>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------- deduction rule

export function DeductionRuleDialog({
  subContractId,
  rule,
  open,
  onOpenChange,
}: DialogProps & { subContractId: number; rule?: DeductionRule }) {
  const add = useAddDeductionRule();
  const update = useUpdateDeductionRule();
  const [kind, setKind] = useState<DeductionKind>(
    rule?.kind ?? DeductionKind.RETENTION
  );
  const [label, setLabel] = useState(rule?.label ?? '');
  const [effect, setEffect] = useState<AdjustmentEffect>(
    rule?.effect ?? AdjustmentEffect.DEDUCT
  );
  const [basis, setBasis] = useState<DeductionBasis>(
    rule?.basis ?? DeductionBasis.PERCENT
  );
  const [rate, setRate] = useState(
    rule?.rate === undefined ? '' : String(rule.rate)
  );
  const [fixed, setFixed] = useState(
    rule?.fixedAmount === undefined ? '' : String(rule.fixedAmount)
  );
  const [cap, setCap] = useState(
    rule?.capAmount === undefined ? '' : String(rule.capAmount)
  );
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);
  const pending = add.isPending || update.isPending;

  const changeKind = (next: DeductionKind) => {
    setKind(next);
    setEffect(
      ADDING_KINDS.has(next) ? AdjustmentEffect.ADD : AdjustmentEffect.DEDUCT
    );
    if (!label.trim()) setLabel(KIND_LABELS[next]);
  };

  const save = () => {
    const capValue = parseAmountInput(cap);
    if (capValue === undefined) {
      setError('Enter the cap in rupees, or leave it blank.');
      return;
    }
    let rateValue: number | undefined;
    let fixedValue: number | undefined;
    if (basis === DeductionBasis.PERCENT) {
      const parsed = parseAmountInput(rate);
      if (
        parsed === undefined ||
        parsed === null ||
        parsed <= 0 ||
        parsed > 100
      ) {
        setError('Enter a percent above 0 and up to 100.');
        return;
      }
      rateValue = parsed;
    } else {
      const parsed = parseAmountInput(fixed);
      if (parsed === undefined || parsed === null || parsed <= 0) {
        setError('Enter the fixed amount per bill in rupees.');
        return;
      }
      fixedValue = parsed;
    }
    const req = {
      kind,
      label: label.trim() || KIND_LABELS[kind],
      effect,
      basis,
      rate: rateValue,
      fixedAmount: fixedValue,
      capAmount: capValue ?? undefined,
      enabled,
      sortOrder: rule?.sortOrder,
    };
    const done = {
      onSuccess: () => {
        toast.success(`Rule "${req.label}" saved`);
        onOpenChange(false);
      },
      onError: failed('Could not save the rule'),
    };
    if (rule) update.mutate({ ruleId: rule.id, req }, done);
    else add.mutate({ subContractId, req }, done);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Edit deduction rule' : 'Add deduction rule'}
          </DialogTitle>
          <DialogDescription>
            Applied to every bill of this contract when it is certified. Percent
            rules run on the value of the work plus approved variations;
            certified bills keep the amounts they froze.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field id="rule-kind" label="Kind">
            <select
              id="rule-kind"
              className={SELECT_CLASS}
              value={kind}
              onChange={(e) => changeKind(e.target.value as DeductionKind)}
            >
              {Object.values(DeductionKind).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field id="rule-effect" label="Effect">
            <select
              id="rule-effect"
              className={SELECT_CLASS}
              value={effect}
              onChange={(e) => setEffect(e.target.value as AdjustmentEffect)}
            >
              <option value={AdjustmentEffect.DEDUCT}>
                Deduct from the bill
              </option>
              <option value={AdjustmentEffect.ADD}>Add to the bill</option>
            </select>
          </Field>
          <div className="col-span-2">
            <Field id="rule-label" label="Label on the bill">
              <Input
                id="rule-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Retention 5%"
              />
            </Field>
          </div>
          <Field id="rule-basis" label="Basis">
            <select
              id="rule-basis"
              className={SELECT_CLASS}
              value={basis}
              onChange={(e) => setBasis(e.target.value as DeductionBasis)}
            >
              <option value={DeductionBasis.PERCENT}>
                Percent of the bill
              </option>
              <option value={DeductionBasis.FIXED}>
                Fixed amount per bill
              </option>
            </select>
          </Field>
          {basis === DeductionBasis.PERCENT ? (
            <Field id="rule-rate" label="Percent">
              <Input
                id="rule-rate"
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="5"
              />
            </Field>
          ) : (
            <Field id="rule-fixed" label="Amount per bill (₹)">
              <Input
                id="rule-fixed"
                inputMode="decimal"
                value={fixed}
                onChange={(e) => setFixed(e.target.value)}
              />
            </Field>
          )}
          <Field id="rule-cap" label="Cap over the contract (₹, optional)">
            <Input
              id="rule-cap"
              inputMode="decimal"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Apply to the next certification
          </label>
        </div>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------- milestone requirement

export function RequirementDialog({
  subContractId,
  milestoneId,
  requirement,
  open,
  onOpenChange,
}: DialogProps & {
  subContractId: number;
  milestoneId: number;
  requirement?: MilestoneRequirement;
}) {
  const add = useAddMilestoneRequirement();
  const update = useUpdateMilestoneRequirement();
  const [title, setTitle] = useState(requirement?.title ?? '');
  const [type, setType] = useState<RequirementType>(
    requirement?.type ?? RequirementType.SCOPE
  );
  const [description, setDescription] = useState(
    requirement?.description ?? ''
  );
  const [mandatory, setMandatory] = useState(requirement?.mandatory ?? true);
  const [dueDate, setDueDate] = useState(requirement?.dueDate ?? '');
  const [status, setStatus] = useState<RequirementStatus>(
    requirement?.status ?? RequirementStatus.PENDING
  );
  const [remarks, setRemarks] = useState(requirement?.remarks ?? '');
  const [error, setError] = useState<string | null>(null);
  const pending = add.isPending || update.isPending;

  const save = () => {
    if (!title.trim()) {
      setError('Enter what the milestone needs.');
      return;
    }
    const req = {
      title: title.trim(),
      type,
      description: description.trim() || undefined,
      mandatory,
      dueDate: dueDate || undefined,
      status,
      remarks: remarks.trim() || undefined,
      sortOrder: requirement?.sortOrder,
    };
    const done = {
      onSuccess: () => {
        toast.success(`Requirement "${req.title}" saved`);
        onOpenChange(false);
      },
      onError: failed('Could not save the requirement'),
    };
    if (requirement)
      update.mutate({ requirementId: requirement.id, req }, done);
    else add.mutate({ subContractId, milestoneId, req }, done);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {requirement ? 'Edit requirement' : 'Add requirement'}
          </DialogTitle>
          <DialogDescription>
            A milestone bill is certified only when every mandatory requirement
            is completed or not applicable.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field id="req-title" label="Requirement">
              <Input
                id="req-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Concrete strength tests"
              />
            </Field>
          </div>
          <Field id="req-type" label="Type">
            <select
              id="req-type"
              className={SELECT_CLASS}
              value={type}
              onChange={(e) => setType(e.target.value as RequirementType)}
            >
              {Object.values(RequirementType).map((t) => (
                <option key={t} value={t}>
                  {REQUIREMENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field id="req-status" label="Status">
            <select
              id="req-status"
              className={SELECT_CLASS}
              value={status}
              onChange={(e) => setStatus(e.target.value as RequirementStatus)}
            >
              {Object.values(RequirementStatus).map((s) => (
                <option key={s} value={s}>
                  {REQUIREMENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field id="req-due" label="Due date (optional)">
            <Input
              id="req-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              checked={mandatory}
              onChange={(e) => setMandatory(e.target.checked)}
            />
            Mandatory for certification
          </label>
          <div className="col-span-2">
            <Field id="req-description" label="Description (optional)">
              <Textarea
                id="req-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field id="req-remarks" label="Remarks (optional)">
              <Input
                id="req-remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Field>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
