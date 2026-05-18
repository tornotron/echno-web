'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { routes } from '@/nav';
import { Card } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import {
  Plus,
  Loader2,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Package,
} from 'lucide-react';
import { useSiteTransfers } from '@/hooks/site-transfers';
import { TransferTable } from '@/features/site-transfer/components';
import { SiteTransferStatus } from '@/types/site-transfers';

export default function SiteTransfersPage() {
  const { data: transfers = [], isLoading } = useSiteTransfers();

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
      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [transfers, searchQuery, statusFilter, projectFilter]);

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

  const pending = transfers.filter(
    (t) => t.status === SiteTransferStatus.pending
  ).length;
  const completed = transfers.filter(
    (t) => t.status === SiteTransferStatus.completed
  ).length;
  const totalItems = transfers.reduce((sum, t) => sum + t.items.length, 0);

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
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Pending</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-yellow-600 dark:text-yellow-400">
                {pending}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              in transit
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
              Items Moved
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                {totalItems}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <Package className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              total line items
            </p>
          </div>
        </div>
      </Card>

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
