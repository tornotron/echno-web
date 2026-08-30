'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { useVendors } from '@tornotron/echno-core/vendor/hooks';
import { useGRNs } from '@tornotron/echno-core/grn/hooks';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { ContractType } from '@/services/payables-service';
import type { PayableCreationRequest } from '@/services/payables-service';
import {
  checkPayableDraft,
  CONTRACTOR_NAME_MAX_LENGTH,
  PAYABLE_NUMBER_MAX_LENGTH,
} from '../payable-action-gates';
import type { PayableDraft, PayableDraftProblem } from '../payable-action-gates';

/** How the contract types read on screen, in the order the enum declares them. */
const contractTypeLabels: Record<ContractType, string> = {
  [ContractType.MATERIAL_SUPPLY]: 'Material supply',
  [ContractType.LABOR_CONTRACT]: 'Labour contract',
  [ContractType.EQUIPMENT_RENTAL]: 'Equipment rental',
  [ContractType.SERVICE_CONTRACT]: 'Service contract',
  [ContractType.SUBCONTRACTOR]: 'Subcontractor',
  [ContractType.CONSULTANT]: 'Consultant',
  [ContractType.OTHER]: 'Other',
};

/** The value a Select uses for "none", since an empty string is not allowed. */
const NONE = 'NONE';

const EMPTY_DRAFT: PayableDraft = {
  payableNumber: '',
  contractorName: '',
  contractType: '',
  amountRecorded: '',
  projectId: '',
  vendorId: '',
  goodsReceivedNoteId: '',
};

interface CreatePayableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * The employee id to record as raising the payable, or undefined when the
   * signed-in user has no employee record in this organization.
   */
  createdByEmployeeId?: number;
  /** Payable numbers already on screen, to catch a duplicate before the 409. */
  takenNumbers: readonly string[];
  onConfirm: (request: PayableCreationRequest) => void;
  isPending: boolean;
}

function problemFor(
  problems: PayableDraftProblem[],
  field: PayableDraftProblem['field']
): string | undefined {
  return problems.find((problem) => problem.field === field)?.reason;
}

/**
 * Raises a payable.
 *
 * Nothing else in the backend creates one: no GRN, purchase order or invoice
 * flow calls `PayableService.createPayable`, so this form is the only way a
 * payable comes into existence. A read-only screen would have shown an empty
 * table for as long as that stayed true.
 *
 * The opening `amountPaid` the creation DTO accepts is deliberately not
 * offered. `createPayable` stores it with no check, so an opening payment
 * larger than the recorded amount would be accepted and leave a payable that
 * is permanently over-paid and can never take another payment. Money enters
 * only through the payment endpoint, which is behind the overpayment check and
 * the row lock.
 */
export function CreatePayableDialog({
  open,
  onOpenChange,
  createdByEmployeeId,
  takenNumbers,
  onConfirm,
  isPending,
}: CreatePayableDialogProps) {
  const [draft, setDraft] = useState<PayableDraft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState(false);
  // The dialog is closed from the parent on success, so the reset has to hang
  // off the open transition rather than off dismissal.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(EMPTY_DRAFT);
      setSubmitted(false);
    }
  }

  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: vendors = [], isLoading: vendorsLoading } = useVendors();
  const { data: grns = [], isLoading: grnsLoading } = useGRNs();

  const problems = checkPayableDraft(draft, {
    takenNumbers,
    hasEmployeeRecord: createdByEmployeeId !== undefined,
  });
  const show = submitted;

  const set = (field: keyof PayableDraft) => (value: string) =>
    setDraft((previous) => ({ ...previous, [field]: value }));

  function submit() {
    setSubmitted(true);
    if (problems.length > 0 || createdByEmployeeId === undefined) return;

    onConfirm({
      payableNumber: draft.payableNumber.trim(),
      contractorName: draft.contractorName.trim(),
      // checkPayableDraft has already established this is a member of the enum.
      contractType: draft.contractType as ContractType,
      amountRecorded: Number(draft.amountRecorded.trim()),
      projectId: Number(draft.projectId),
      vendorId: draft.vendorId ? Number(draft.vendorId) : undefined,
      goodsReceivedNoteId: draft.goodsReceivedNoteId
        ? Number(draft.goodsReceivedNoteId)
        : undefined,
      createdBy: createdByEmployeeId,
    });
  }

  const fieldError = (field: PayableDraftProblem['field']) =>
    show ? problemFor(problems, field) : undefined;

  const helper = (field: PayableDraftProblem['field'], fallback: string) => {
    const error = fieldError(field);
    return (
      <p
        className={
          error
            ? 'text-xs text-rose-600 dark:text-rose-400'
            : 'text-xs text-zinc-500 dark:text-zinc-400'
        }
      >
        {error ?? fallback}
      </p>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise a payable</DialogTitle>
          <DialogDescription>
            Record an amount owed to a contractor or vendor. Payments against it
            are recorded afterwards, one at a time, and cannot take it past this
            amount.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payable-number">Payable number</Label>
            <Input
              id="payable-number"
              value={draft.payableNumber}
              onChange={(e) => set('payableNumber')(e.target.value)}
              maxLength={PAYABLE_NUMBER_MAX_LENGTH}
              disabled={isPending}
              aria-invalid={fieldError('payableNumber') !== undefined}
            />
            {helper(
              'payableNumber',
              `Your own reference for this payable. Up to ${PAYABLE_NUMBER_MAX_LENGTH} characters, and unique within the organization.`
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractor-name">Contractor</Label>
            <Input
              id="contractor-name"
              value={draft.contractorName}
              onChange={(e) => set('contractorName')(e.target.value)}
              maxLength={CONTRACTOR_NAME_MAX_LENGTH}
              disabled={isPending}
              aria-invalid={fieldError('contractorName') !== undefined}
            />
            {helper('contractorName', 'Who the money is owed to.')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract-type">What it is for</Label>
            <Select
              value={draft.contractType}
              onValueChange={set('contractType')}
              disabled={isPending}
            >
              <SelectTrigger id="contract-type" className="w-full">
                <SelectValue placeholder="Choose a contract type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(contractTypeLabels) as ContractType[]).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {contractTypeLabels[value]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            {helper('contractType', 'How this payable is classified.')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount-recorded">Amount</Label>
            <Input
              id="amount-recorded"
              inputMode="decimal"
              autoComplete="off"
              value={draft.amountRecorded}
              onChange={(e) => set('amountRecorded')(e.target.value)}
              placeholder="0.00"
              disabled={isPending}
              aria-invalid={fieldError('amountRecorded') !== undefined}
            />
            {helper(
              'amountRecorded',
              'What is owed in total, to two decimal places.'
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payable-project">Project</Label>
            <Select
              value={draft.projectId}
              onValueChange={set('projectId')}
              disabled={isPending || projectsLoading}
            >
              <SelectTrigger id="payable-project" className="w-full">
                <SelectValue
                  placeholder={
                    projectsLoading ? 'Loading projects' : 'Choose a project'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {helper('projectId', 'The project the cost belongs to. Required.')}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payable-vendor">Vendor</Label>
            <Select
              value={draft.vendorId || NONE}
              onValueChange={(value) =>
                set('vendorId')(value === NONE ? '' : value)
              }
              disabled={isPending || vendorsLoading}
            >
              <SelectTrigger id="payable-vendor" className="w-full">
                <SelectValue
                  placeholder={vendorsLoading ? 'Loading vendors' : 'No vendor'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No vendor</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={String(vendor.id)}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Optional, but a payable with no vendor cannot be found by the
              vendor filter on this screen.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payable-grn">Goods received note</Label>
            <Select
              value={draft.goodsReceivedNoteId || NONE}
              onValueChange={(value) =>
                set('goodsReceivedNoteId')(value === NONE ? '' : value)
              }
              disabled={isPending || grnsLoading}
            >
              <SelectTrigger id="payable-grn" className="w-full">
                <SelectValue
                  placeholder={grnsLoading ? 'Loading notes' : 'No GRN'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No GRN</SelectItem>
                {grns.map((grn) => (
                  <SelectItem key={grn.id} value={String(grn.id)}>
                    {grn.grnNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Optional. Links the payable to the receipt it came from.
            </p>
          </div>

          {show && problemFor(problems, 'createdBy') && (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              {problemFor(problems, 'createdBy')}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Raise payable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
