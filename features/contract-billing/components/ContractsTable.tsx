'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileCheck2, Plus } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import { useBillingContracts } from '@tornotron/echno-core/contract-billing/hooks';
import type { ContractBillingSummary } from '@tornotron/echno-core/contract-billing/types';
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
import { BillStatusChip, ModelChip } from './chips';
import { NewBillDialog } from './NewBillDialog';

const PAGE_SIZE = 20;

/**
 * One project's contracts: each with its billing model, what is certified and
 * paid so far and its open bill. Starting billing on a contract is where the
 * user chooses RA or milestone; after that the next bill follows the contract's
 * model.
 */
export function ContractsTable({ projectId }: { projectId: number }) {
  const [page, setPage] = useState(0);
  const [dialog, setDialog] = useState<ContractBillingSummary | null>(null);
  const contracts = useBillingContracts({
    projectId,
    pageNo: page,
    pageSize: PAGE_SIZE,
  });
  const { allowed: canPrepare } = useCan(BILL_PREPARE_ACCESS);

  const rows = contracts.data?.content ?? [];
  const totalPages = contracts.data?.totalPages ?? 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Contracts</CardTitle>
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
                  Third Party, link it to this project, then come back here to
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
                  <TableHead className="text-right">Contract value</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead className="text-right">
                    Certified to date
                  </TableHead>
                  <TableHead className="text-right">Due</TableHead>
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
    </>
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
          href={
            routes.inspections.billing.contracts.detail(row.subContractId).href
          }
        >
          {row.contractName}
        </Link>
        <p className="text-muted-foreground text-xs">
          {row.contractorName}
          {row.contractRef ? ` · ${row.contractRef}` : ''}
        </p>
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
      <TableCell className="text-right">{formatInr(row.amountDue)}</TableCell>
      <TableCell>
        {row.openBill ? (
          <Link
            href={routes.inspections.billing.bills.detail(row.openBill.id).href}
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
