'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Card, CardContent } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
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
import { SearchAndFilter, Pagination, PageHeader } from '@/components/common';
import {
  Plus,
  Loader2,
  ShoppingCart,
  FileText,
  CheckCircle2,
  Truck,
} from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { format } from 'date-fns';
import { usePurchaseOrders } from '@/hooks/purchase-orders/use-purchase-orders';
import {
  PurchaseOrderStatus,
  purchaseOrderStatusLabels,
  purchaseOrderStatusBadgeColors,
} from '@/types/purchase-orders';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const { data: orders = [], isLoading } = usePurchaseOrders();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [prevFilters, setPrevFilters] = useState({
    searchQuery,
    statusFilter,
    itemsPerPage,
  });

  if (
    prevFilters.searchQuery !== searchQuery ||
    prevFilters.statusFilter !== statusFilter ||
    prevFilters.itemsPerPage !== itemsPerPage
  ) {
    setPrevFilters({ searchQuery, statusFilter, itemsPerPage });
    setCurrentPage(1);
  }

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return orders.filter((po) => {
      const matchesSearch =
        !searchQuery ||
        po.poNumber.toLowerCase().includes(q) ||
        po.vendorName.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'all' || po.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = filtered.slice(startIndex, endIndex);

  const stats = {
    total: orders.length,
    draft: orders.filter((po) => po.status === PurchaseOrderStatus.draft)
      .length,
    approved: orders.filter((po) => po.status === PurchaseOrderStatus.approved)
      .length,
    sentToVendor: orders.filter(
      (po) => po.status === PurchaseOrderStatus.sentToVendor
    ).length,
  };

  const hasActiveFilters = !!searchQuery || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Manage vendor purchase orders"
        actions={
          <Button asChild>
            <Link href={routes.resources.purchaseOrders.new}>
              <Plus className="mr-2 h-4 w-4" />
              Create PO
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total POs
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {stats.total}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <ShoppingCart className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all time</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Draft</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {stats.draft}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <FileText className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              not submitted
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Approved</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {stats.approved}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              ready to dispatch
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Sent to Vendor
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                {stats.sentToVendor}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <Truck className="size-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              awaiting delivery
            </p>
          </div>
        </div>
      </Card>

      {/* Search & Filter */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by PO number or vendor..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Status',
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            },
            options: [
              { value: 'all', label: 'All Statuses' },
              ...Object.values(PurchaseOrderStatus).map((s) => ({
                value: s,
                label: purchaseOrderStatusLabels[s],
              })),
            ],
          },
        ]}
      />

      {/* Results summary + rows per page */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {filtered.length === 0
            ? 'No purchase orders found'
            : `Showing ${startIndex + 1} to ${Math.min(endIndex, filtered.length)} of ${filtered.length} purchase order${filtered.length === 1 ? '' : 's'}`}
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Rows per page:
          </span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(v) => {
              setItemsPerPage(Number(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table or empty state */}
      {paginated.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead className="pr-6">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((po) => (
                  <TableRow
                    key={po.id}
                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    onClick={() =>
                      router.push(
                        routes.resources.purchaseOrders.detail(po.id).href
                      )
                    }
                  >
                    <TableCell className="pl-6 font-medium">
                      {po.poNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {po.vendorName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={purchaseOrderStatusBadgeColors[po.status]}
                      >
                        {purchaseOrderStatusLabels[po.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {po.items.length}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {po.expectedDeliveryDate
                        ? format(
                            new Date(po.expectedDeliveryDate),
                            'MMM dd, yyyy'
                          )
                        : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground pr-6 text-sm">
                      {po.totalAmount == null
                        ? '—'
                        : `₹${po.totalAmount.toLocaleString('en-IN')}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Card>
      ) : (
        <Empty variant="default">
          <EmptyMedia variant="icon">
            <ShoppingCart className="size-6" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No purchase orders found</EmptyTitle>
            <EmptyDescription>
              {hasActiveFilters
                ? 'No purchase orders match your filters. Try adjusting your search.'
                : 'Create your first purchase order to get started.'}
            </EmptyDescription>
          </EmptyHeader>
          {!hasActiveFilters && (
            <Button asChild>
              <Link href={routes.resources.purchaseOrders.new}>Create PO</Link>
            </Button>
          )}
        </Empty>
      )}
    </div>
  );
}
