'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/nav';
import { Pagination } from '@/components/common';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { Building2, Loader2, Search } from 'lucide-react';
import {
  getVendorTypeLabel,
  VendorStatus,
  VendorType,
  VENDOR_STATUS_LABELS,
  VENDOR_TYPE_LABELS,
} from '@/types/vendor';
import type { Vendor } from '@/types/vendor';
import { VendorAvatar } from './vendor-avatar';
import { VendorStatusBadge } from './vendor-status-badge';
import {
  Empty,
  EmptyErrorMedia,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';

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

interface VendorTableProps {
  vendors: Vendor[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  pageNo: number;
  pageSize: number;
  onPageChange: (pageNo: number) => void;
  onRetry: () => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
}

export function VendorTable({
  vendors,
  isLoading,
  isError,
  error,
  pageNo,
  pageSize,
  onPageChange,
  onRetry,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
}: VendorTableProps) {
  const router = useRouter();
  const hasFilters =
    searchValue !== '' || statusFilter !== 'all' || typeFilter !== 'all';

  const toolbar = (
    <CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-1">
      <div className="relative w-full max-w-xs">
        <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or email..."
          className="h-8 pl-8 text-sm"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="h-8 w-36 text-xs">
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
      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="h-8 w-36 text-xs">
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
    </CardHeader>
  );

  if (isLoading) {
    return (
      <Card>
        {toolbar}
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        {toolbar}
        <CardContent>
          <Empty variant="default">
            <EmptyErrorMedia>
              <Building2 className="size-6" />
            </EmptyErrorMedia>
            <EmptyHeader>
              <EmptyTitle>Failed to load vendors</EmptyTitle>
              <EmptyDescription>
                {error instanceof Error
                  ? error.message
                  : 'An unexpected error occurred.'}
              </EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  if (vendors.length === 0) {
    return (
      <Card>
        {toolbar}
        <CardContent>
          <Empty variant="default">
            <EmptyMedia variant="icon">
              <Building2 className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No vendors found</EmptyTitle>
              <EmptyDescription>
                {hasFilters
                  ? 'Try adjusting your filters.'
                  : 'Add your first vendor to get started.'}
              </EmptyDescription>
            </EmptyHeader>
            {!hasFilters && (
              <Button asChild>
                <Link href={routes.thirdParty.vendors.new}>Add Vendor</Link>
              </Button>
            )}
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {toolbar}
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company & Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Purchase Value</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow
                key={vendor.id}
                className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                onClick={() =>
                  router.push(routes.thirdParty.vendors.detail(vendor.id).href)
                }
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <VendorAvatar name={vendor.name} />
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-sm text-zinc-500">
                        {vendor.contactPerson ?? vendor.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {vendor.type ? (
                    <Badge variant="outline">
                      {getVendorTypeLabel(vendor.type)}
                    </Badge>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {vendor.totalPurchaseValue ? (
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      ₹{(vendor.totalPurchaseValue / 100_000).toFixed(1)}L
                    </span>
                  ) : (
                    <span className="text-zinc-500">—</span>
                  )}
                  <div className="text-xs text-zinc-500">
                    {vendor.totalOrders ?? 0} orders
                  </div>
                </TableCell>
                <TableCell>
                  {vendor.totalOutstanding && vendor.totalOutstanding > 0 ? (
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      ₹{(vendor.totalOutstanding / 1000).toFixed(0)}K
                    </span>
                  ) : (
                    <span className="text-zinc-500">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <VendorStatusBadge status={vendor.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <div className="flex justify-end border-t px-4 py-2">
        <Pagination
          currentPage={pageNo + 1}
          totalPages={vendors.length < pageSize ? pageNo + 1 : pageNo + 2}
          onPageChange={(p) => onPageChange(p - 1)}
        />
      </div>
    </Card>
  );
}
