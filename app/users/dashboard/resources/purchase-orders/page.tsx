'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/shadcn/card';
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(
          [
            {
              label: 'Total POs',
              count: stats.total,
              color: 'blue',
              icon: ShoppingCart,
            },
            {
              label: 'Draft',
              count: stats.draft,
              color: 'zinc',
              icon: FileText,
            },
            {
              label: 'Approved',
              count: stats.approved,
              color: 'green',
              icon: CheckCircle2,
            },
            {
              label: 'Sent to Vendor',
              count: stats.sentToVendor,
              color: 'purple',
              icon: Truck,
            },
          ] as const
        ).map(({ label, count, color, icon: Icon }) => {
          const colorClasses = {
            blue: {
              bg: 'bg-blue-100 dark:bg-blue-900/20',
              text: 'text-blue-600 dark:text-blue-400',
            },
            zinc: {
              bg: 'bg-zinc-100 dark:bg-zinc-800',
              text: 'text-zinc-600 dark:text-zinc-400',
            },
            green: {
              bg: 'bg-green-100 dark:bg-green-900/20',
              text: 'text-green-600 dark:text-green-400',
            },
            purple: {
              bg: 'bg-purple-100 dark:bg-purple-900/20',
              text: 'text-purple-600 dark:text-purple-400',
            },
          } satisfies Record<string, { bg: string; text: string }>;

          const classes = colorClasses[color];
          return (
            <Card key={label}>
              <CardHeader className="pb-3">
                <CardDescription>{label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${classes.bg}`}
                  >
                    <Icon className={`h-6 w-6 ${classes.text}`} />
                  </div>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {count}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
