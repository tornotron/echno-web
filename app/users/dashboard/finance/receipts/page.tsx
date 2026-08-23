'use client';

import { useMemo } from 'react';
import { useReceipts } from '@/hooks/receipts';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { PageHeader, ActiveFilterChip } from '@/components/common';
import {
  useEmployeeFilterFromParams,
  rowMatchesEmployeeFilter,
  ROLE_LABELS,
} from '@/hooks/use-employee-filter';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { Receipt as ReceiptIcon, DollarSign, FileText } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';
import { ReceiptStatus } from '@/types/finance/receipt';
import { ReceiptsTable } from '@/features/receipts';

export default function ReceiptsPage() {
  const { data: receipts = [], isLoading, isError } = useReceipts();
  const { data: projects = [] } = useProjects();

  const { employeeId, role, name, clear } = useEmployeeFilterFromParams();
  const filteredReceipts =
    employeeId != null && role
      ? receipts.filter((r) =>
          rowMatchesEmployeeFilter(r, employeeId, role, {
            issuer: (rec) => rec.issuedBy,
            creator: (rec) => rec.createdBy,
          })
        )
      : receipts;

  const projectById = useMemo(() => {
    const m = new Map<number, { projectName: string }>();
    for (const p of projects) m.set(p.id, p);
    return m;
  }, [projects]);

  const totalReceipts = receipts.length;
  const issuedReceipts = receipts.filter(
    (r) => r.status === ReceiptStatus.issued
  ).length;
  const draftReceipts = receipts.filter(
    (r) => r.status === ReceiptStatus.draft
  ).length;
  const totalAmount = receipts
    .filter((r) => r.status === ReceiptStatus.issued)
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Receipts"
        description="Track and manage all financial receipts"
        actions={
          <Button asChild>
            <Link href={routes.finance.receipts.new}>New Receipt</Link>
          </Button>
        }
      />

      {/* Statistics Cards */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Receipts
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {totalReceipts}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <ReceiptIcon className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all time</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Issued</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {issuedReceipts}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <FileText className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              active receipts
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Drafts</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-yellow-600 dark:text-yellow-400">
                {draftReceipts}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <FileText className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              pending issue
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Amount
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                ₹{(totalAmount / 1_000_000).toFixed(1)}M
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <DollarSign className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              issued receipts
            </p>
          </div>
        </div>
      </Card>

      {employeeId != null && name && (
        <ActiveFilterChip
          label={ROLE_LABELS[role ?? ''] ?? 'Filtered by'}
          name={name}
          onDismiss={clear}
        />
      )}

      <ReceiptsTable
        receipts={filteredReceipts}
        isLoading={isLoading}
        isError={isError}
        projectById={projectById}
      />
    </div>
  );
}
