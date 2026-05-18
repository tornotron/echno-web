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
  ClipboardList,
  Clock,
  TruckIcon,
  Package,
} from 'lucide-react';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { useIndentsPaginated } from '@/hooks/indents';
import { IndentTable } from '@/features/indents/components';
import { IndentStatus } from '@/types/indents';

export default function IndentsPage() {
  const {
    data: indents = [],
    isLoading,
    isError,
  } = useIndentsPaginated(0, 200);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return indents.filter((i) => {
      const matchesSearch =
        !searchQuery ||
        i.indentNumber.toLowerCase().includes(q) ||
        i.projectName?.toLowerCase().includes(q) ||
        i.createdBy.name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
      const matchesProject =
        projectFilter === 'all' || i.projectName === projectFilter;
      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [indents, searchQuery, statusFilter, projectFilter]);

  const projectOptions = useMemo(() => {
    const names = new Set<string>();
    for (const i of indents) {
      if (i.projectName) names.add(i.projectName);
    }
    return [...names].toSorted();
  }, [indents]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: indents.length,
    pending: indents.filter((i) => i.status === IndentStatus.pending).length,
    ordered: indents.filter((i) => i.status === IndentStatus.ordered).length,
    onSite: indents.filter((i) => i.status === IndentStatus.onSite).length,
  };

  const hasActiveFilters =
    !!searchQuery || statusFilter !== 'all' || projectFilter !== 'all';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <ClipboardList className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Failed to load indents</EmptyTitle>
          <EmptyDescription>
            An unexpected error occurred. Please try again.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Indents"
        description="Manage material indent requests"
        actions={
          <Button asChild>
            <Link href={routes.resources.indents.new}>
              <Plus className="mr-2 h-4 w-4" />
              New Indent
            </Link>
          </Button>
        }
      />

      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Indents
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {stats.total}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <ClipboardList className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all time</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Pending</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-yellow-600 dark:text-yellow-400">
                {stats.pending}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              awaiting action
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Ordered</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                {stats.ordered}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <Package className="size-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              PO raised
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">On Site</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {stats.onSite}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <TruckIcon className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              delivered
            </p>
          </div>
        </div>
      </Card>

      <IndentTable
        paginated={paginated}
        filteredCount={filtered.length}
        startIndex={startIndex}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(n) => {
          setItemsPerPage(n);
          setCurrentPage(1);
        }}
        currentPage={currentPage}
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
          setStatusFilter(v);
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
