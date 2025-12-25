'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppLayout, Pagination, SearchAndFilter } from '@/components/common';
import {
  Receipt,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
} from 'lucide-react';
import {
  GoodsReceiptStatus,
  goodsReceiptStatusLabels,
  goodsReceiptStatusColors,
} from '@/types/resource/goods-receipt';
import { mockGoodsReceipts } from '@/components/shared/mock-data';

const getStatusBadgeColor = (status: GoodsReceiptStatus): string => {
  const baseColors = goodsReceiptStatusColors[status];
  const colors = {
    zinc: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    orange:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  };
  return colors[baseColors as keyof typeof colors] || colors.zinc;
};

export default function GoodsReceiptsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Filter receipts based on search and filters
  const filteredReceipts = useMemo(() => {
    return mockGoodsReceipts.filter((grn) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        grn.receiptNumber.toLowerCase().includes(searchLower) ||
        grn.purchaseOrderId.toString().includes(searchLower);

      // Status filter
      const matchesStatus =
        statusFilter === 'all' || grn.status === statusFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const today = new Date();
        const receiptDate = new Date(grn.receivedDate);
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));

        switch (dateFilter) {
          case 'today': {
            matchesDate = receiptDate >= startOfToday;

            break;
          }
          case 'last7days': {
            const last7Days = new Date(today.setDate(today.getDate() - 7));
            matchesDate = receiptDate >= last7Days;

            break;
          }
          case 'last30days': {
            const last30Days = new Date(today.setDate(today.getDate() - 30));
            matchesDate = receiptDate >= last30Days;

            break;
          }
          case 'thisMonth': {
            const startOfMonth = new Date(
              today.getFullYear(),
              today.getMonth(),
              1
            );
            matchesDate = receiptDate >= startOfMonth;

            break;
          }
          // No default
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [searchQuery, statusFilter, dateFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReceipts = filteredReceipts.slice(startIndex, endIndex);

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(
        paginatedReceipts
          .map((g) => g.id)
          .filter((id): id is number => id !== undefined)
      );
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const isAllSelected =
    paginatedReceipts.length > 0 &&
    selectedIds.length === paginatedReceipts.length;

  // Calculate stats
  const totalReceipts = mockGoodsReceipts.length;
  const pendingQC = mockGoodsReceipts.filter(
    (g) => g.status === GoodsReceiptStatus.pending
  ).length;
  const withDiscrepancies = mockGoodsReceipts.filter(
    (g) => g.hasDiscrepancies
  ).length;
  const processedToday = mockGoodsReceipts.filter(
    (g) =>
      g.status === GoodsReceiptStatus.processed &&
      format(g.receivedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ).length;

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
    setCurrentPage(1);
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Goods Receipts (GRN)
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Manage goods receipt notes and track deliveries
              </p>
            </div>
            <Link href="/dashboard/resources/goods-receipts/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Record Receipt
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Receipts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {totalReceipts}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending QC</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {pendingQC}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>With Discrepancies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {withDiscrepancies}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Processed Today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {processedToday}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <SearchAndFilter
          variant="card"
          searchValue={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search by receipt number or PO number..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          filters={[
            {
              placeholder: 'Status',
              options: [
                { value: 'all', label: 'All Statuses' },
                ...Object.values(GoodsReceiptStatus).map((status) => ({
                  value: status,
                  label: goodsReceiptStatusLabels[status],
                })),
              ],
              value: statusFilter,
              onChange: (value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              },
            },
            {
              placeholder: 'Date Range',
              options: [
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'last7days', label: 'Last 7 Days' },
                { value: 'last30days', label: 'Last 30 Days' },
                { value: 'thisMonth', label: 'This Month' },
              ],
              value: dateFilter,
              onChange: (value) => {
                setDateFilter(value);
                setCurrentPage(1);
              },
            },
          ]}
        />

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to{' '}
            {Math.min(endIndex, filteredReceipts.length)} of{' '}
            {filteredReceipts.length} goods receipts
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Rows per page:
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Goods Receipts Table */}
        {filteredReceipts.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Discrepancies</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReceipts.map((grn) => (
                    <TableRow
                      key={grn.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() =>
                        (globalThis.location.href = `/dashboard/resources/goods-receipts/${grn.id}`)
                      }
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={
                            grn.id !== undefined && selectedIds.includes(grn.id)
                          }
                          onCheckedChange={(checked) =>
                            grn.id !== undefined &&
                            handleSelectOne(grn.id, checked as boolean)
                          }
                          aria-label={`Select ${grn.receiptNumber}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {grn.receiptNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/resources/purchase-orders/${grn.purchaseOrderId}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          PO-{grn.purchaseOrderId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-zinc-400" />
                          <span className="text-zinc-900 dark:text-zinc-100">
                            Vendor #{grn.vendorId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-400">
                        {format(grn.receivedDate, 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                        ₹{(grn.totalReceivedValue / 100_000).toFixed(2)}L
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(grn.status)}>
                          {goodsReceiptStatusLabels[grn.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {grn.hasDiscrepancies ? (
                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-xs font-medium">Yes</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">No</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Receipt className="mx-auto h-12 w-12 text-zinc-400" />
                <h3 className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  No goods receipts found
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {hasActiveFilters
                    ? 'Try adjusting your search or filters'
                    : 'Get started by recording your first goods receipt'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
