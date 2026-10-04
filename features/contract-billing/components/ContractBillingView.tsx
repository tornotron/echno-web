'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileCheck2, Pencil, Plus, Trash2 } from 'lucide-react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  useContractBilling,
  useDeleteBoqItem,
  useDeleteDeductionRule,
  useDeleteMilestoneRequirement,
  useUpdateDeductionRule,
} from '@tornotron/echno-core/contract-billing/hooks';
import {
  DeductionBasis,
  type BillSummary,
  type BillingMilestone,
  type BoqItem,
  type ContractBillingDetail,
  type DeductionRule,
  type MilestoneRequirement,
} from '@tornotron/echno-core/contract-billing/types';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  Empty,
  EmptyDescription,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
} from '@/components/shadcn/empty';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import { useCan } from '@/hooks/use-can';
import { toast } from '@/lib/styles/toast-styles';
import { BILL_PREPARE_ACCESS, BILLING_SIGN_ACCESS } from '@/nav/access/roles';
import { routes } from '@/nav';
import { contractAction, newBillLabel } from '../lib/actions';
import { formatDate, formatInr, formatPercent, formatQty } from '../lib/format';
import { KIND_LABELS, REQUIREMENT_TYPE_LABELS } from '../lib/labels';
import { BillStatusChip, ModelChip, RequirementStatusChip } from './chips';
import { NewBillDialog } from './NewBillDialog';
import {
  BoqItemDialog,
  DeductionRuleDialog,
  RequirementDialog,
} from './SetupDialogs';

type Dialog =
  | { kind: 'newBill' }
  | { kind: 'boq'; item?: BoqItem }
  | { kind: 'rule'; rule?: DeductionRule }
  | {
      kind: 'requirement';
      milestoneId: number;
      requirement?: MilestoneRequirement;
    };

function failed(title: string) {
  return (err: unknown) =>
    toast.error(getErrorTitle(err, title), {
      description: getErrorMessage(err),
    });
}

/**
 * One contract's billing: its BOQ, deduction rules, milestones with their
 * requirements, and its bills. The project manager and admin keep the BOQ
 * and rules; the site team keeps the milestone requirements.
 */
export function ContractBillingView({
  subContractId,
}: {
  subContractId: number;
}) {
  const { data, isPending, isError, error } = useContractBilling(subContractId);
  const { allowed: canSetUp } = useCan(BILLING_SIGN_ACCESS);
  const { allowed: canPrepare } = useCan(BILL_PREPARE_ACCESS);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = (open: boolean) => {
    if (!open) setDialog(null);
  };

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <Empty variant="error">
        <EmptyErrorMedia>
          <FileCheck2 className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Could not load this contract&apos;s billing</EmptyTitle>
          <EmptyDescription>{getErrorMessage(error)}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const { summary } = data;
  const action = contractAction(summary);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={summary.contractName}
        description={`${summary.contractorName}${summary.projectName ? ` · ${summary.projectName}` : ''}${summary.contractRef ? ` · ${summary.contractRef}` : ''}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={routes.finance.billing.href}>
                <ArrowLeft className="size-4" />
                Billing
              </Link>
            </Button>
            {canPrepare && (
              <Button
                disabled={action.kind === 'blocked'}
                title={action.kind === 'blocked' ? action.reason : undefined}
                onClick={() => setDialog({ kind: 'newBill' })}
              >
                <Plus className="size-4" />
                {newBillLabel(
                  action.kind === 'new'
                    ? action.model
                    : action.kind === 'blocked'
                      ? action.model
                      : undefined
                )}
              </Button>
            )}
          </>
        }
      />
      {action.kind === 'blocked' && canPrepare && (
        <p className="text-muted-foreground text-sm">{action.reason}</p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Figure
          label="Billing"
          value={<ModelChip model={summary.billingModel} />}
        />
        <Figure
          label="Contract value"
          value={formatInr(summary.contractValue)}
        />
        <Figure label="BOQ total" value={formatInr(data.boqTotal)} />
        <Figure
          label="Certified to date"
          value={`${formatInr(summary.certifiedToDate)} (${formatPercent(summary.billedPercent)})`}
        />
        <Figure
          label="Net approved"
          value={formatInr(summary.netApprovedToDate)}
        />
      </div>

      <Tabs
        defaultValue={
          summary.billingModel === 'MILESTONE' ? 'milestones' : 'boq'
        }
      >
        <TabsList>
          <TabsTrigger value="boq">BOQ ({data.boqItems.length})</TabsTrigger>
          <TabsTrigger value="rules">
            Deductions ({data.deductionRules.length})
          </TabsTrigger>
          <TabsTrigger value="milestones">
            Milestones ({data.milestones.length})
          </TabsTrigger>
          <TabsTrigger value="bills">Bills ({data.bills.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="boq">
          <BoqTab
            data={data}
            canEdit={canSetUp}
            onEdit={(item) => setDialog({ kind: 'boq', item })}
          />
        </TabsContent>
        <TabsContent value="rules">
          <RulesTab
            data={data}
            canEdit={canSetUp}
            onEdit={(rule) => setDialog({ kind: 'rule', rule })}
          />
        </TabsContent>
        <TabsContent value="milestones">
          <MilestonesTab
            data={data}
            canEdit={canPrepare}
            onEdit={(milestoneId, requirement) =>
              setDialog({ kind: 'requirement', milestoneId, requirement })
            }
          />
        </TabsContent>
        <TabsContent value="bills">
          <BillsTable bills={data.bills} />
        </TabsContent>
      </Tabs>

      {dialog?.kind === 'newBill' && (
        <NewBillDialog
          subContractId={subContractId}
          contractName={`${summary.contractName} (${summary.contractorName})`}
          model={summary.billingModel}
          open
          onOpenChange={close}
        />
      )}
      {dialog?.kind === 'boq' && (
        <BoqItemDialog
          subContractId={subContractId}
          item={dialog.item}
          open
          onOpenChange={close}
        />
      )}
      {dialog?.kind === 'rule' && (
        <DeductionRuleDialog
          subContractId={subContractId}
          rule={dialog.rule}
          open
          onOpenChange={close}
        />
      )}
      {dialog?.kind === 'requirement' && (
        <RequirementDialog
          subContractId={subContractId}
          milestoneId={dialog.milestoneId}
          requirement={dialog.requirement}
          open
          onOpenChange={close}
        />
      )}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="gap-1 py-3">
      <CardContent className="px-4">
        <p className="text-muted-foreground text-xs">{label}</p>
        <div className="text-sm font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function BoqTab({
  data,
  canEdit,
  onEdit,
}: {
  data: ContractBillingDetail;
  canEdit: boolean;
  onEdit: (item?: BoqItem) => void;
}) {
  const remove = useDeleteBoqItem();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Bill of quantities</CardTitle>
        {canEdit && (
          <Button size="sm" onClick={() => onEdit()}>
            <Plus className="size-4" />
            Add item
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {data.boqItems.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No BOQ items yet. A running account bill lists every BOQ item of the
            contract, so enter the BOQ before opening the first RA bill.
            {canEdit ? '' : ' A project manager or admin enters it.'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Contract qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Certified qty</TableHead>
                {canEdit && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.boqItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemCode}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">
                    {formatQty(item.contractQuantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatInr(item.rate)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatInr(item.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatQty(item.certifiedQuantity)}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${item.itemCode}`}
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${item.itemCode}`}
                        disabled={item.inUse || remove.isPending}
                        title={
                          item.inUse
                            ? 'This item is on a bill, so it stays on the BOQ.'
                            : undefined
                        }
                        onClick={() =>
                          remove.mutate(item.id, {
                            onSuccess: () =>
                              toast.success(`Item ${item.itemCode} deleted`),
                            onError: failed('Could not delete the item'),
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={5} className="text-right font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatInr(data.boqTotal)}
                </TableCell>
                <TableCell colSpan={canEdit ? 2 : 1} />
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function RulesTab({
  data,
  canEdit,
  onEdit,
}: {
  data: ContractBillingDetail;
  canEdit: boolean;
  onEdit: (rule?: DeductionRule) => void;
}) {
  const remove = useDeleteDeductionRule();
  const update = useUpdateDeductionRule();
  const toggle = (rule: DeductionRule) =>
    update.mutate(
      {
        ruleId: rule.id,
        req: {
          kind: rule.kind,
          label: rule.label,
          effect: rule.effect,
          basis: rule.basis,
          rate: rule.rate,
          fixedAmount: rule.fixedAmount,
          capAmount: rule.capAmount,
          enabled: !rule.enabled,
          sortOrder: rule.sortOrder,
        },
      },
      {
        onSuccess: () =>
          toast.success(
            rule.enabled
              ? `"${rule.label}" disabled`
              : `"${rule.label}" enabled`
          ),
        onError: failed('Could not change the rule'),
      }
    );
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Deductions and additions</CardTitle>
        {canEdit && (
          <Button size="sm" onClick={() => onEdit()}>
            <Plus className="size-4" />
            Add rule
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {data.retentionPercentage !== undefined &&
          data.deductionRules.length === 0 && (
            <p className="text-muted-foreground mb-2 text-sm">
              The contract records retention of{' '}
              {formatPercent(data.retentionPercentage)}. It becomes a rule when
              billing starts.
            </p>
          )}
        {data.deductionRules.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No rules yet. Add retention, advance recovery, TDS, GST or a
            penalty, and each certified bill applies them.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Effect</TableHead>
                <TableHead className="text-right">Rate or amount</TableHead>
                <TableHead className="text-right">Cap</TableHead>
                <TableHead className="text-right">Applied to date</TableHead>
                <TableHead>State</TableHead>
                {canEdit && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.deductionRules.map((rule) => (
                <TableRow
                  key={rule.id}
                  className={rule.enabled ? '' : 'opacity-60'}
                >
                  <TableCell className="font-medium">{rule.label}</TableCell>
                  <TableCell>{KIND_LABELS[rule.kind]}</TableCell>
                  <TableCell>
                    {rule.effect === 'ADD' ? 'Adds' : 'Deducts'}
                  </TableCell>
                  <TableCell className="text-right">
                    {rule.basis === DeductionBasis.PERCENT
                      ? formatPercent(rule.rate)
                      : formatInr(rule.fixedAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {rule.capAmount === undefined
                      ? 'None'
                      : formatInr(rule.capAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatInr(rule.appliedToDate)}
                  </TableCell>
                  <TableCell>{rule.enabled ? 'Applied' : 'Disabled'}</TableCell>
                  {canEdit && (
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggle(rule)}
                        disabled={update.isPending}
                      >
                        {rule.enabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${rule.label}`}
                        onClick={() => onEdit(rule)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${rule.label}`}
                        disabled={rule.appliedToDate > 0 || remove.isPending}
                        title={
                          rule.appliedToDate > 0
                            ? 'Applied to a certified bill; disable it instead.'
                            : undefined
                        }
                        onClick={() =>
                          remove.mutate(rule.id, {
                            onSuccess: () =>
                              toast.success(`"${rule.label}" deleted`),
                            onError: failed('Could not delete the rule'),
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function MilestonesTab({
  data,
  canEdit,
  onEdit,
}: {
  data: ContractBillingDetail;
  canEdit: boolean;
  onEdit: (milestoneId: number, requirement?: MilestoneRequirement) => void;
}) {
  if (data.milestones.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-6 text-sm">
          This contract has no milestones. Milestones, with their amount or
          payment percentage, are entered on the sub-contract itself.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      {data.milestones.map((milestone) => (
        <MilestoneCard
          key={milestone.id}
          subContractId={data.summary.subContractId}
          milestone={milestone}
          canEdit={canEdit}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

function MilestoneCard({
  milestone,
  canEdit,
  onEdit,
}: {
  subContractId: number;
  milestone: BillingMilestone;
  canEdit: boolean;
  onEdit: (milestoneId: number, requirement?: MilestoneRequirement) => void;
}) {
  const remove = useDeleteMilestoneRequirement();
  const satisfied = milestone.requirements.filter(
    (r) => r.status === 'COMPLETED' || r.status === 'NOT_APPLICABLE'
  ).length;
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>{milestone.name}</CardTitle>
          <p className="text-muted-foreground text-sm">
            Value {formatInr(milestone.value)} · target{' '}
            {formatDate(milestone.targetDate)} ·{' '}
            {formatPercent(milestone.certifiedPercent)} certified · {satisfied}{' '}
            of {milestone.requirements.length} requirements met
          </p>
          {milestone.value === undefined && (
            <p className="text-destructive text-sm">
              No amount or payment percentage is recorded, so this milestone
              cannot be billed yet.
            </p>
          )}
        </div>
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(milestone.id)}
          >
            <Plus className="size-4" />
            Add requirement
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {milestone.requirements.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No requirements yet. Add the scope, tests, QA/QC checks and
            documents this milestone needs before it is certified for payment.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requirement</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mandatory</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                {canEdit && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestone.requirements.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <span className="font-medium">{r.title}</span>
                    {r.description && (
                      <p className="text-muted-foreground text-xs">
                        {r.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{REQUIREMENT_TYPE_LABELS[r.type]}</TableCell>
                  <TableCell>{r.mandatory ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{formatDate(r.dueDate)}</TableCell>
                  <TableCell>
                    <RequirementStatusChip status={r.status} />
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${r.title}`}
                        onClick={() => onEdit(milestone.id, r)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${r.title}`}
                        disabled={remove.isPending}
                        onClick={() =>
                          remove.mutate(r.id, {
                            onSuccess: () =>
                              toast.success(`"${r.title}" deleted`),
                            onError: failed('Could not delete the requirement'),
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function BillsTable({ bills }: { bills: BillSummary[] }) {
  if (bills.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-6 text-sm">
          No bills on this contract yet. Open the first one with the button at
          the top.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill</TableHead>
              <TableHead>Period or milestone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Claimed</TableHead>
              <TableHead className="text-right">Certified</TableHead>
              <TableHead className="text-right">Net payable</TableHead>
              <TableHead>Approved</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell>
                  <Link
                    className="font-medium hover:underline"
                    href={routes.finance.billing.bills.detail(bill.id).href}
                  >
                    {bill.billNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  {bill.billingModel === 'MILESTONE'
                    ? (bill.milestoneName ?? '-')
                    : `${formatDate(bill.periodFrom)} to ${formatDate(bill.periodTo)}`}
                </TableCell>
                <TableCell>
                  <BillStatusChip status={bill.status} />
                </TableCell>
                <TableCell className="text-right">
                  {formatInr(bill.grossClaimed)}
                </TableCell>
                <TableCell className="text-right">
                  {formatInr(bill.grossCertified)}
                </TableCell>
                <TableCell className="text-right">
                  {formatInr(bill.netPayable)}
                </TableCell>
                <TableCell>{formatDate(bill.approvedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
