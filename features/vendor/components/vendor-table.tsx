'use client';

import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Pagination } from '@/components/common';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent } from '@/components/shadcn/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { Building2, Loader2 } from 'lucide-react';
import { getVendorTypeLabel } from '@/types/vendor';
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

interface VendorTableProps {
  vendors: Vendor[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  pageNo: number;
  pageSize: number;
  hasFilters: boolean;
  onPageChange: (pageNo: number) => void;
  onRetry: () => void;
}

export function VendorTable({
  vendors,
  isLoading,
  isError,
  error,
  pageNo,
  pageSize,
  hasFilters,
  onPageChange,
  onRetry,
}: VendorTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12">
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
        <CardContent className="py-12">
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
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
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
        <Pagination
          currentPage={pageNo + 1}
          totalPages={vendors.length < pageSize ? pageNo + 1 : pageNo + 2}
          onPageChange={(p) => onPageChange(p - 1)}
        />
      </CardContent>
    </Card>
  );
}
