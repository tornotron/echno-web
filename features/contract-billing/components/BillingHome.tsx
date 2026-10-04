'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileCheck2, Plus } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useBillingContracts,
  useBillingOverview,
} from '@tornotron/echno-core/contract-billing/hooks';
import type { ContractBillingSummary } from '@tornotron/echno-core/contract-billing/types';
import { useProjects } from '@tornotron/echno-core/project/hooks';
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
  EmptyMedia,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/shadcn/tooltip';
import { useCan } from '@/hooks/use-can';
import { BILL_PREPARE_ACCESS } from '@/nav/access/roles';
import { routes } from '@/nav';
import { contractAction, newBillLabel } from '../lib/actions';
import { formatInr, formatPercent } from '../lib/format';
import { BillStatusChip, ModelChip, SELECT_CLASS } from './chips';
import { NewBillDialog } from './NewBillDialog';

const PAGE_SIZE = 20;

/**
 * The one billing home page for RA and milestone billing: the organization's
 * figures by stage, then every contract with its billing model, what is
 * certified so far and its open bill. Starting billing on a contract is where
 * the user chooses RA or milestone; after that the next bill follows the
 * contract's model.
 */
export function BillingHome() {
  const [projectId, setProjectId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [dialog, setDialog] = useState<ContractBillingSummary | null>(null);
  const overview = useBillingOverview();
  const contracts = useBillingContracts({
    projectId,
    pageNo: page,
    pageSize: PAGE_SIZE,
  });
  const { data: projects = [] } = useProjects();
  const { allowed: canPrepare } = useCan(BILL_PREPARE_ACCESS);

  const o = overview.data;
  const cards: { label: string; value: string; hint: string }[] = [
    {
      label: 'Open bills',
      value: String(o?.openBills ?? 0),
      hint: `${o?.drafts ?? 0} in draft, ${o?.returned ?? 0} returned`,
    },
    {
      label: 'Awaiting verification',
      value: String(o?.awaitingVerification ?? 0),
      hint: 'Submitted, joint measurement due',
    },
    {
      label: 'Awaiting certification',
      value: String(o?.awaitingCertification ?? 0),
      hint: 'Verified, ready to certify',
    },
    {
      label: 'Awaiting approval',
      value: String(o?.awaitingApproval ?? 0),
      hint: 'Certified, final approval due',
    },
    {
      label: 'Certified to date',
      value: formatInr(o?.certifiedToDate ?? 0),
      hint: 'Gross of certified and approved bills',
    },
    {
      label: 'Net approved',
      value: formatInr(o?.netApprovedToDate ?? 0),
      hint: `${o?.approvedBills ?? 0} bills handed to finance`,
    },
  ];

  const rows = contracts.data?.content ?? [];
  const totalPages = contracts.data?.totalPages ?? 0;

  return (
    <div className="space-y-4">
      {overview.isError ? (
        <p role="alert" className="text-destructive text-sm">
          Could not load the billing figures: {getErrorMessage(overview.error)}
        </p>
      ) : (
        <div
          className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
          data-testid="billing-overview"
        >
          {cards.map((card) => (
            <Card key={card.label} className="gap-1 py-3">
              <CardContent className="px-4">
                <p className="text-muted-foreground text-xs">{card.label}</p>
                {overview.isPending ? (
                  <Skeleton className="mt-1 h-6 w-20" />
                ) : (
                  <p className="text-lg font-semibold">{card.value}</p>
                )}
                <p className="text-muted-foreground text-xs">{card.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Contracts</CardTitle>
          <select
            aria-label="Filter by project"
            className={`${SELECT_CLASS} sm:w-64`}
            value={projectId ?? ''}
            onChange={(e) => {
              setProjectId(e.target.value ? Number(e.target.value) : undefined);
              setPage(0);
            }}
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectName}
              </option>
            ))}
          </select>
        </CardHeader>
        <CardContent>
          {contracts.isPending && <Skeleton className="h-40 w-full" />}
          {contracts.isError && (
            <Empty variant="error">
              <EmptyErrorMedia>
                <FileCheck2 className="size-6" />
              </EmptyErrorMedia>
              <EmptyHeader>
                <EmptyTitle>Could not load the contracts</EmptyTitle>
                <EmptyDescription>
                  {getErrorMessage(contracts.error)}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {!contracts.isPending && !contracts.isError && rows.length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileCheck2 className="size-6" />
                </EmptyMedia>
                <EmptyTitle>No contracts to bill</EmptyTitle>
                <EmptyDescription>
                  Bills are raised on sub-contracts. Add a sub-contract under
                  Third Party, link it to a project, then come back here to
                  start billing it.
                </EmptyDescription>
              </EmptyHeader>
              <Button asChild variant="outline">
                <Link href={routes.thirdParty.subContracts.href}>
                  Go to sub-contracts
                </Link>
              </Button>
            </Empty>
          )}
          {rows.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Contract value</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead className="text-right">
                    Certified to date
                  </TableHead>
                  <TableHead>Open bill</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <ContractRow
                    key={row.subContractId}
                    row={row}
                    canPrepare={canPrepare}
                    onBill={() => setDialog(row)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-end gap-2 text-sm">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span>
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {dialog && (
        <NewBillDialog
          key={dialog.subContractId}
          subContractId={dialog.subContractId}
          contractName={`${dialog.contractName} (${dialog.contractorName})`}
          model={dialog.billingModel}
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
        />
      )}
    </div>
  );
}

function ContractRow({
  row,
  canPrepare,
  onBill,
}: {
  row: ContractBillingSummary;
  canPrepare: boolean;
  onBill: () => void;
}) {
  const action = contractAction(row);
  return (
    <TableRow>
      <TableCell>
        <Link
          className="font-medium hover:underline"
          href={routes.finance.billing.contracts.detail(row.subContractId).href}
        >
          {row.contractName}
        </Link>
        <p className="text-muted-foreground text-xs">
          {row.contractorName}
          {row.contractRef ? ` · ${row.contractRef}` : ''}
        </p>
      </TableCell>
      <TableCell>
        {row.projectName || (
          <span className="text-muted-foreground">Not linked</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {formatInr(row.contractValue)}
      </TableCell>
      <TableCell>
        <ModelChip model={row.billingModel} />
      </TableCell>
      <TableCell className="text-right">
        {formatInr(row.certifiedToDate)}
        <p className="text-muted-foreground text-xs">
          {formatPercent(row.billedPercent)}
        </p>
      </TableCell>
      <TableCell>
        {row.openBill ? (
          <Link
            href={routes.finance.billing.bills.detail(row.openBill.id).href}
            className="inline-flex items-center gap-2 hover:underline"
          >
            {row.openBill.billNumber}
            <BillStatusChip status={row.openBill.status} />
          </Link>
        ) : (
          <span className="text-muted-foreground text-sm">None</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {canPrepare &&
          (action.kind === 'blocked' ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button size="sm" variant="outline" disabled>
                    <Plus className="size-4" />
                    {newBillLabel(action.model)}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{action.reason}</TooltipContent>
            </Tooltip>
          ) : (
            <Button size="sm" onClick={onBill}>
              <Plus className="size-4" />
              {newBillLabel(action.kind === 'new' ? action.model : undefined)}
            </Button>
          ))}
      </TableCell>
    </TableRow>
  );
}
