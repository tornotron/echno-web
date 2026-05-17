'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { routes } from '@/nav';
import { Card, CardContent } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Pagination, SearchAndFilter, PageHeader } from '@/components/common';
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
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { mockStockAdjustments } from '@/components/shared/mock-data';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';

// Helper functions for badge colors
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

  // Filter adjustments
  const filteredAdjustments = useMemo(() => {
    return mockStockAdjustments.filter((adjustment) => {
      const matchesSearch =
        adjustment.adjustmentNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        adjustment.lineItems.some((item) =>
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        adjustment.locationId?.toString().includes(searchQuery);

      const matchesType =
        typeFilter === 'all' || adjustment.type === typeFilter;
      const matchesStatus =
        statusFilter === 'all' || adjustment.status === statusFilter;
      const matchesReason =
        reasonFilter === 'all' || adjustment.primaryReason === reasonFilter;

      return matchesSearch && matchesType && matchesStatus && matchesReason;
    });
  }, [searchQuery, typeFilter, statusFilter, reasonFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAdjustments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAdjustments = filteredAdjustments.slice(startIndex, endIndex);

  // Calculate stats
  const totalAdjustments = mockStockAdjustments.length;
  const pendingAdjustments = mockStockAdjustments.filter(
    (a) => a.status === 'pending'
  ).length;
  const positiveVariance = mockStockAdjustments
    .filter((a) => a.totalVarianceQuantity > 0)
    .reduce((sum, a) => sum + a.totalVarianceQuantity, 0);
  const negativeVariance = Math.abs(
    mockStockAdjustments
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

      {/* Filters */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by adjustment ID, material..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Type',
            options: [
              { value: 'all', label: 'All Types' },
              { value: 'correction', label: 'Correction' },
              { value: 'write-off', label: 'Write-off' },
              { value: 'found', label: 'Found Items' },
              { value: 'return', label: 'Return' },
            ],
            value: typeFilter,
            onChange: (value) => {
              setTypeFilter(value);
              setCurrentPage(1);
            },
          },
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ],
            value: statusFilter,
            onChange: (value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            },
          },
          {
            placeholder: 'Reason',
            options: [
              { value: 'all', label: 'All Reasons' },
              { value: 'stock-discrepancy', label: 'Stock Discrepancy' },
              { value: 'damage', label: 'Damage' },
              { value: 'expiry', label: 'Expiry' },
              { value: 'theft', label: 'Theft' },
              { value: 'found-items', label: 'Found Items' },
              { value: 'counting-error', label: 'Counting Error' },
            ],
            value: reasonFilter,
            onChange: (value) => {
              setReasonFilter(value);
              setCurrentPage(1);
            },
          },
        ]}
      />

      {/* Results Summary */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {startIndex + 1} to{' '}
          {Math.min(endIndex, filteredAdjustments.length)} of{' '}
          {filteredAdjustments.length} adjustments
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Rows per page:
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number.parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stock Adjustments List */}
      {filteredAdjustments.length > 0 ? (
        <Card>
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
                      {/* Left Section */}
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
                            <span className="text-zinc-500 dark:text-zinc-500">
                              Location ID:
                            </span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {adj.locationId || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">
                              System Qty:
                            </span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {adj.lineItems[0]?.systemQuantity || 0}{' '}
                              {adj.lineItems[0]?.unit || ''}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">
                              Physical Qty:
                            </span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {adj.lineItems[0]?.physicalQuantity || 0}{' '}
                              {adj.lineItems[0]?.unit || ''}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">
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

                      {/* Right Section */}
                      <div className="flex flex-col gap-2 lg:items-end">
                        <div className="text-right">
                          <p className="text-sm text-zinc-500 dark:text-zinc-500">
                            Reason
                          </p>
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

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Card>
      ) : (
        <Card>
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
        </Card>
      )}
    </div>
  );
}
