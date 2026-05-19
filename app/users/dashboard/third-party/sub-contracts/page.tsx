'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import {
  CheckCircle,
  DollarSign,
  Download,
  FileText,
  Plus,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';
import { useSubContracts } from '@/hooks/sub-contracts';
import { SubContractTable } from '@/features/sub-contracts';

export default function SubContractsPage() {
  const { data: contracts = [], isLoading, isError } = useSubContracts();
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
    ...new Set(contracts.map((c) => c.projectName).filter(Boolean)),
  ].toSorted() as string[];

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      c.contractName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contractId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contractorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    const matchesProject =
      projectFilter === 'all' || c.projectName === projectFilter;
    return matchesSearch && matchesStatus && matchesType && matchesProject;
  });

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedContracts = filteredContracts.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const stats = {
    total: contracts.length,
    active: contracts.filter((c) => c.status === 'active').length,
    totalValue: contracts.reduce((sum, c) => sum + c.contractValue, 0),
    totalOutstanding: contracts.reduce((sum, c) => sum + c.totalDue, 0),
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Sub-Contract Management"
        description="Manage sub-contractor agreements and work orders"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" asChild>
              <Link href={routes.thirdParty.subContracts.new}>
                <Plus className="mr-2 h-4 w-4" />
                New Contract
              </Link>
            </Button>
          </>
        }
      />

      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Contracts
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight">{stats.total}</p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <FileText className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              All contracts
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Active Contracts
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight">
                {stats.active}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              In progress
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Value
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight">
                ₹{(stats.totalValue / 10_000_000).toFixed(1)}Cr
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <TrendingUp className="size-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Contract value
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Outstanding
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight">
                ₹{(stats.totalOutstanding / 10_000_000).toFixed(1)}Cr
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <DollarSign className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Pending payments
            </p>
          </div>
        </div>
      </Card>

      <SubContractTable
        paginated={paginatedContracts}
        filteredCount={filteredContracts.length}
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
