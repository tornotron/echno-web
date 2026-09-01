'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { routes } from '@/nav';
import { Card } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { PageHeader, ActiveFilterChip } from '@/components/common';
import {
  useEmployeeFilterFromParams,
  rowMatchesEmployeeFilter,
  ROLE_LABELS,
} from '@/hooks/use-employee-filter';
import {
  Plus,
  Loader2,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Package,
} from 'lucide-react';
import { useSiteTransfers } from '@tornotron/echno-core/site-transfers/hooks';
import { TransferTable } from '@/features/site-transfers/components';
import { SiteTransferStatus } from '@tornotron/echno-core/site-transfers/types';

export default function SiteTransfersPage() {
  const { data: transfers = [], isLoading } = useSiteTransfers();

  const { employeeId, role, name, clear } = useEmployeeFilterFromParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SiteTransferStatus | 'all'>(
    'all'
  );
  const [projectFilter, setProjectFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return transfers.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.transferNumber.toLowerCase().includes(q) ||
        t.sendingPerson.name.toLowerCase().includes(q) ||
        t.receivingProjectName?.toLowerCase().includes(q) ||
        t.sendingProjectName?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesProject =
        projectFilter === 'all' ||
        t.sendingProjectName === projectFilter ||
        t.receivingProjectName === projectFilter;
      const matchesEmployee =
        employeeId == null ||
        role == null ||
        rowMatchesEmployeeFilter(t, employeeId, role, {
          sender: (row) => row.sendingPerson?.id,
        });
      return (
        matchesSearch && matchesStatus && matchesProject && matchesEmployee
      );
    });
  }, [transfers, searchQuery, statusFilter, projectFilter, employeeId, role]);

  const projectOptions = useMemo(() => {
    const names = new Set<string>();
    for (const t of transfers) {
      if (t.sendingProjectName) names.add(t.sendingProjectName);
      if (t.receivingProjectName) names.add(t.receivingProjectName);
    }
    return [...names].toSorted();
  }, [transfers]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Open means dispatched and not yet settled either way. PARTIALLY_TRANSFERRED
  // belongs here as much as PENDING: part of its stock is still on the road.
  const open = transfers.filter(
    (t) =>
      t.status === SiteTransferStatus.pending ||
      t.status === SiteTransferStatus.partiallyTransferred
  ).length;
  const completed = transfers.filter(
    (t) => t.status === SiteTransferStatus.completed
  ).length;

  // Stock that has left one site and has not been recorded at another, summed
  // across every transfer that is still open. echno-backend#660 means an
  // organisation-wide on-hand total is now short by exactly this, which is the
  // truth about material on a lorry but looks like an error to anybody who adds
  // up the sites. Naming the figure is what makes the two agree. A cancelled
  // transfer is excluded: its stock went back to the sender and is on hand
  // there, even though its lines still report what they once had in transit.
  let inTransit = 0;
  for (const transfer of transfers) {
    if (
      transfer.status !== SiteTransferStatus.pending &&
      transfer.status !== SiteTransferStatus.partiallyTransferred
    ) {
      continue;
    }
    for (const item of transfer.items) {
      inTransit += item.inTransitQuantity;
    }
  }

  const hasActiveFilters =
    !!searchQuery || statusFilter !== 'all' || projectFilter !== 'all';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Site Transfers"
        description="Material transfers between sites and projects"
        actions={
          <Button asChild>
            <Link href={routes.resources.transfers.new}>
              <Plus className="mr-2 h-4 w-4" />
              New Transfer
            </Link>
          </Button>
        }
      />

      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Transfers
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {transfers.length}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <ArrowRightLeft className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all time</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Open</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-yellow-600 dark:text-yellow-400">
                {open}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              awaiting confirmation
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Completed
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {completed}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              delivered
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              In Transit
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                {inTransit}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <Package className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              counted at neither site
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

      <TransferTable
        paginated={paginated}
        filteredCount={filtered.length}
        startIndex={startIndex}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(n) => {
          setItemsPerPage(n);
          setCurrentPage(1);
        }}
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        hasActiveFilters={hasActiveFilters}
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(v) => {
          setStatusFilter(v as SiteTransferStatus | 'all');
          setCurrentPage(1);
        }}
        projectFilter={projectFilter}
        onProjectChange={(v) => {
          setProjectFilter(v);
          setCurrentPage(1);
        }}
        projectOptions={projectOptions}
      />
    </div>
  );
}
