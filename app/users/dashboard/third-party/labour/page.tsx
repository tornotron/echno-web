'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import {
  Download,
  Plus,
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';
import { useLabour } from '@tornotron/echno-core/labour/hooks';
import { LabourStatus } from '@tornotron/echno-core/labour/types';
import { LabourTable } from '@/features/labour';

export default function LabourPage() {
  const { data: labour = [], isLoading, isError } = useLabour();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const hasActiveFilters =
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    projectFilter !== 'all' ||
    searchQuery !== '';

  const uniqueProjects = [
    ...new Set(
      labour
        .map((l) => l.currentProjectName)
        .filter((p): p is string => p !== undefined && p !== null)
    ),
  ].toSorted();

  const filteredLabour = labour.filter((l) => {
    const matchesSearch =
      (l.fullName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.labourId ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.specialization ?? '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchesType = typeFilter === 'all' || l.employmentType === typeFilter;
    const matchesProject =
      projectFilter === 'all' || l.currentProjectName === projectFilter;
    return matchesSearch && matchesStatus && matchesType && matchesProject;
  });

  const totalPages = Math.ceil(filteredLabour.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedLabour = filteredLabour.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const stats = {
    total: labour.length,
    active: labour.filter((l) => l.status === LabourStatus.ACTIVE).length,
    totalDue: labour.reduce((sum, l) => sum + (l.totalDue ?? 0), 0),
    onLeave: labour.filter((l) => l.status === LabourStatus.ON_LEAVE).length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Labour Management"
        description="Manage daily wage workers and contract labour"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" asChild>
              <Link href={routes.thirdParty.labour.new}>
                <Plus className="mr-2 h-4 w-4" />
                Add Labour
              </Link>
            </Button>
          </>
        }
      />

      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Labour
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight">{stats.total}</p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                <Users className="size-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Registered workers
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Active Workers
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight">
                {stats.active}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <UserCheck className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Currently working
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Outstanding
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight">
                ₹{stats.totalDue.toLocaleString()}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <DollarSign className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Pending payments
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">On Leave</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight">
                {stats.onLeave}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <TrendingUp className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Currently absent
            </p>
          </div>
        </div>
      </Card>

      <LabourTable
        paginated={paginatedLabour}
        filteredCount={filteredLabour.length}
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
        isLoading={isLoading}
        isError={isError}
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
        typeFilter={typeFilter}
        onTypeChange={(v) => {
          setTypeFilter(v);
          setCurrentPage(1);
        }}
        projectFilter={projectFilter}
        onProjectChange={(v) => {
          setProjectFilter(v);
          setCurrentPage(1);
        }}
        projectOptions={uniqueProjects}
      />
    </div>
  );
}
