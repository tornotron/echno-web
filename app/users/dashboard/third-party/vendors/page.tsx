'use client';

import { useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Card } from '@/components/shadcn/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Plus,
  Building2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';
import { PageHeader } from '@/components/common';
import { useVendorsPaginated } from '@/hooks/vendors';
import {
  VendorStatus,
  VendorType,
  VENDOR_TYPE_LABELS,
  VENDOR_STATUS_LABELS,
} from '@/types/vendor';
import { VendorTable } from '@/features/vendor';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  ...Object.values(VendorStatus).map((s) => ({
    value: s,
    label: VENDOR_STATUS_LABELS[s],
  })),
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  ...Object.values(VendorType).map((t) => ({
    value: t,
    label: VENDOR_TYPE_LABELS[t],
  })),
];

export default function VendorsPage() {
  const [pageNo, setPageNo] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const {
    data: vendors = [],
    isLoading,
    error,
    isError,
  } = useVendorsPaginated(pageNo, PAGE_SIZE);

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

  const hasFilters =
    search !== '' || statusFilter !== 'all' || typeFilter !== 'all';

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Vendor Management"
        description="Manage suppliers and service providers"
        actions={
          <Button size="sm" asChild>
            <Link href={routes.thirdParty.vendors.new}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Link>
          </Button>
        }
      />

      {/* Statistics */}
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

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageNo(0);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPageNo(0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setPageNo(0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <VendorTable
        vendors={filtered}
        isLoading={isLoading}
        isError={isError}
        error={error instanceof Error ? error : null}
        pageNo={pageNo}
        pageSize={PAGE_SIZE}
        hasFilters={hasFilters}
        onPageChange={setPageNo}
        onRetry={() => setPageNo(0)}
      />
    </div>
  );
}
