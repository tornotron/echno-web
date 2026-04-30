'use client';

import { useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/shadcn/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Package,
  Plus,
  Building2,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Search,
} from 'lucide-react';
import Link from 'next/link';
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
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            <Package className="h-8 w-8" />
            Vendor Management
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Manage suppliers and service providers
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/users/dashboard/third-party/vendors/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Link>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Registered vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-2xl font-bold">{stats.active}</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <ShoppingCart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-2xl font-bold">
                ₹{(stats.totalPurchase / 1_000_000).toFixed(1)}M
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Lifetime value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Outstanding</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-2xl font-bold">
                ₹{(stats.totalOutstanding / 100_000).toFixed(1)}L
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Pending payments</p>
          </CardContent>
        </Card>
      </div>

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
