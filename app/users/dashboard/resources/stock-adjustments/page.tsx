'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { routes } from '@/nav';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Input } from '@/components/shadcn/input';
import { Pagination, PageHeader } from '@/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Settings,
  Plus,
  Loader2,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  Search,
} from 'lucide-react';
import {
  Empty,
  EmptyErrorMedia,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { useStockAdjustments } from '@/hooks/stock-adjustments';

const getStatusBadgeColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    pending:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    approved:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return colors[status] || colors.draft;
};

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

  const [prevFilters, setPrevFilters] = useState({
    searchQuery,
    typeFilter,
    statusFilter,
    reasonFilter,
    itemsPerPage,
  });

  if (
    prevFilters.searchQuery !== searchQuery ||
    prevFilters.typeFilter !== typeFilter ||
    prevFilters.statusFilter !== statusFilter ||
    prevFilters.reasonFilter !== reasonFilter ||
    prevFilters.itemsPerPage !== itemsPerPage
  ) {
    setPrevFilters({
      searchQuery,
      typeFilter,
      statusFilter,
      reasonFilter,
      itemsPerPage,
    });
    setCurrentPage(1);
  }

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
  const endIndex = Math.min(
    startIndex + itemsPerPage,
    filteredAdjustments.length
  );
  const paginatedAdjustments = filteredAdjustments.slice(startIndex, endIndex);

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

      {/* Stats Cards */}
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

      {/* List Card */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by adjustment ID, material…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="correction">Correction</SelectItem>
              <SelectItem value="write-off">Write-off</SelectItem>
              <SelectItem value="found">Found Items</SelectItem>
              <SelectItem value="return">Return</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={reasonFilter}
            onValueChange={(v) => {
              setReasonFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              <SelectItem value="stock-discrepancy">
                Stock Discrepancy
              </SelectItem>
              <SelectItem value="damage">Damage</SelectItem>
              <SelectItem value="expiry">Expiry</SelectItem>
              <SelectItem value="theft">Theft</SelectItem>
              <SelectItem value="found-items">Found Items</SelectItem>
              <SelectItem value="counting-error">Counting Error</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-2 border-l pl-3">
            <span className="text-xs whitespace-nowrap text-zinc-500">
              Rows per page
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(v) => {
                setItemsPerPage(Number.parseInt(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {paginatedAdjustments.length > 0 ? (
          <>
            <CardContent className="p-6">
              <div className="space-y-4">
                {paginatedAdjustments.map((adj) => (
                  <Link
                    key={adj.id}
                    href={routes.resources.stockAdjustments.detail(adj.id).href}
                    className="block"
                  >
                    <div className="rounded-lg border p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                  {adj.adjustmentNumber}
                                </span>
                                <Badge
                                  className={getStatusBadgeColor(adj.status)}
                                >
                                  {adj.status.charAt(0).toUpperCase() +
                                    adj.status.slice(1)}
                                </Badge>
                                <Badge variant="outline">
                                  {adj.type
                                    .split('_')
                                    .map(
                                      (w: string) =>
                                        w.charAt(0).toUpperCase() + w.slice(1)
                                    )
                                    .join(' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                Material:{' '}
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                  {adj.lineItems[0]?.description || 'N/A'}
                                </span>
                                {adj.lineItems.length > 1 && (
                                  <span className="ml-2 text-xs text-zinc-500">
                                    +{adj.lineItems.length - 1} more items
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                            <div>
                              <span className="text-zinc-500">
                                Location ID:
                              </span>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {adj.locationId || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-zinc-500">System Qty:</span>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {adj.lineItems[0]?.systemQuantity || 0}{' '}
                                {adj.lineItems[0]?.unit || ''}
                              </p>
                            </div>
                            <div>
                              <span className="text-zinc-500">
                                Physical Qty:
                              </span>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {adj.lineItems[0]?.physicalQuantity || 0}{' '}
                                {adj.lineItems[0]?.unit || ''}
                              </p>
                            </div>
                            <div>
                              <span className="text-zinc-500">
                                Total Variance:
                              </span>
                              <Badge
                                variant="outline"
                                className={
                                  adj.totalVarianceQuantity > 0
                                    ? 'text-green-600'
                                    : adj.totalVarianceQuantity < 0
                                      ? 'text-red-600'
                                      : ''
                                }
                              >
                                {adj.totalVarianceQuantity > 0 ? '+' : ''}
                                {adj.totalVarianceQuantity}
                              </Badge>
                            </div>
                          </div>

                          {adj.notes && (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              Note: {adj.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 lg:items-end">
                          <div className="text-right">
                            <p className="text-sm text-zinc-500">Reason</p>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {adj.primaryReason
                                .split('_')
                                .map(
                                  (w: string) =>
                                    w.charAt(0).toUpperCase() + w.slice(1)
                                )
                                .join(' ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
            <div className="flex items-center justify-between border-t px-4 py-2">
              <span className="text-sm text-zinc-500">
                {startIndex + 1}–{endIndex} of {filteredAdjustments.length}{' '}
                adjustment{filteredAdjustments.length === 1 ? '' : 's'}
              </span>
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <CardContent>
            <Empty variant="inline">
              <EmptyMedia variant="icon">
                <Settings className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>
                  {hasActiveFilters
                    ? 'No stock adjustments found'
                    : 'No stock adjustments yet'}
                </EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilters
                    ? "Try adjusting your filters to find what you're looking for."
                    : 'Create your first stock adjustment to get started.'}
                </EmptyDescription>
              </EmptyHeader>
              {hasActiveFilters ? (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              ) : (
                <Button asChild>
                  <Link href={routes.resources.stockAdjustments.new}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Adjustment
                  </Link>
                </Button>
              )}
            </Empty>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
