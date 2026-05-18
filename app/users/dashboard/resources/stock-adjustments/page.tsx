'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { routes } from '@/nav';
import { Card } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import {
  Settings,
  Plus,
  Loader2,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { useStockAdjustments } from '@/hooks/stock-adjustments';
import { StockAdjustmentList } from '@/features/stock-adjustments/components';

export default function StockAdjustmentsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');

  const {
    data: stockAdjustments = [],
    isLoading,
    isError,
  } = useStockAdjustments();

  const filteredAdjustments = useMemo(() => {
    return stockAdjustments.filter((adj) => {
      const matchesSearch =
        adj.adjustmentNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        adj.lineItems.some((item) =>
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        adj.locationId?.toString().includes(searchQuery);
      const matchesType = typeFilter === 'all' || adj.type === typeFilter;
      const matchesStatus =
        statusFilter === 'all' || adj.status === statusFilter;
      const matchesReason =
        reasonFilter === 'all' || adj.primaryReason === reasonFilter;
      return matchesSearch && matchesType && matchesStatus && matchesReason;
    });
  }, [stockAdjustments, searchQuery, typeFilter, statusFilter, reasonFilter]);

  const totalPages = Math.ceil(filteredAdjustments.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginated = filteredAdjustments.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const totalAdjustments = stockAdjustments.length;
  const pendingAdjustments = stockAdjustments.filter(
    (a) => a.status === 'pending'
  ).length;
  const positiveVariance = stockAdjustments
    .filter((a) => a.totalVarianceQuantity > 0)
    .reduce((sum, a) => sum + a.totalVarianceQuantity, 0);
  const negativeVariance = Math.abs(
    stockAdjustments
      .filter((a) => a.totalVarianceQuantity < 0)
      .reduce((sum, a) => sum + a.totalVarianceQuantity, 0)
  );

  const hasActiveFilters = Boolean(
    searchQuery ||
      typeFilter !== 'all' ||
      statusFilter !== 'all' ||
      reasonFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setReasonFilter('all');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError && stockAdjustments.length === 0) {
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <Settings className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Failed to load stock adjustments</EmptyTitle>
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
        title="Stock Adjustments"
        description="Manage stock corrections and adjustments"
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link href={routes.resources.stockAdjustments.new}>
              <Plus className="mr-2 h-4 w-4" />
              New Adjustment
            </Link>
          </Button>
        }
      />

      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Adjustments
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {totalAdjustments}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <FileText className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all time</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Pending</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                {pendingAdjustments}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <Clock className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              awaiting approval
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Surplus</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                +{positiveVariance}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <TrendingUp className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              total positive variance
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Shortage</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
                -{negativeVariance}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                <TrendingDown className="size-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              total negative variance
            </p>
          </div>
        </div>
      </Card>

      <StockAdjustmentList
        paginated={paginated}
        filteredCount={filteredAdjustments.length}
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
        typeFilter={typeFilter}
        onTypeChange={(v) => {
          setTypeFilter(v);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(v) => {
          setStatusFilter(v);
          setCurrentPage(1);
        }}
        reasonFilter={reasonFilter}
        onReasonChange={(v) => {
          setReasonFilter(v);
          setCurrentPage(1);
        }}
        onClearFilters={clearFilters}
      />
    </div>
  );
}
