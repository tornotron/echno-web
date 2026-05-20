'use client';

import { Card } from '@/components/shadcn/card';
import { Building2, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { VendorStatus } from '@/types/vendor';
import type { Vendor } from '@/types/vendor';
import { VendorTable } from './vendor-table';

interface VendorListViewProps {
  vendors: Vendor[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  pageNo: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onRetry: () => void;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
}

export function VendorListView({
  vendors,
  isLoading,
  isError,
  error,
  pageNo,
  pageSize,
  onPageChange,
  onRetry,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
}: VendorListViewProps) {
  const filtered = vendors.filter((v) => {
    const q = search.toLowerCase();
    return (
      (v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q)) &&
      (statusFilter === 'all' || v.status === statusFilter) &&
      (typeFilter === 'all' || v.type === typeFilter)
    );
  });

  const stats = {
    total: vendors.length,
    active: vendors.filter((v) => v.status === VendorStatus.ACTIVE).length,
    totalPurchase: vendors.reduce(
      (sum, v) => sum + (v.totalPurchaseValue ?? 0),
      0
    ),
    totalOutstanding: vendors.reduce(
      (sum, v) => sum + (v.totalOutstanding ?? 0),
      0
    ),
  };

  return (
    <>
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Vendors
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight">{stats.total}</p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Building2 className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Registered vendors
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Active Vendors
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight">
                {stats.active}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <TrendingUp className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Currently active
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Purchase
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight">
                ₹{(stats.totalPurchase / 1_000_000).toFixed(1)}M
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <ShoppingCart className="size-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Lifetime value
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Outstanding
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight">
                ₹{(stats.totalOutstanding / 100_000).toFixed(1)}L
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

      <VendorTable
        vendors={filtered}
        isLoading={isLoading}
        isError={isError}
        error={error}
        pageNo={pageNo}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onRetry={onRetry}
        searchValue={search}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        typeFilter={typeFilter}
        onTypeFilterChange={onTypeFilterChange}
      />
    </>
  );
}
