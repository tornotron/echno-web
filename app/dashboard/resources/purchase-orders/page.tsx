'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout, Pagination, SearchAndFilter } from '@/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Eye,
} from 'lucide-react';
import {
  PurchaseOrderType,
  PurchaseOrderStatus,
  DeliveryStatus,
  purchaseOrderTypeLabels,
  purchaseOrderStatusLabels,
  deliveryStatusLabels,
} from '@/types/resource/purchase-order';
import { mockPurchaseOrders } from '@/components/shared/mock-data';

// Helper functions for badge colors
const getPOStatusBadgeColor = (status: PurchaseOrderStatus): string => {
  const colors = {
    draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    pending:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    sent: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    acknowledged:
      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
    partially_received:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    received:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    partially_invoiced:
      'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    invoiced: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
    completed:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return colors[status];
};

const getDeliveryStatusBadgeColor = (status: DeliveryStatus): string => {
  const colors = {
    pending: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    in_transit:
      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    partially_delivered:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    delivered:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    delayed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return colors[status];
};

export default function PurchaseOrdersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<PurchaseOrderType | 'all'>(
    'all'
  );
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>(
    'all'
  );
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<
    DeliveryStatus | 'all'
  >('all');

  // Filter purchase orders
  const filteredPOs = useMemo(() => {
    return mockPurchaseOrders.filter((po) => {
      const matchesSearch =
        po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || po.type === typeFilter;
      const matchesStatus =
        statusFilter === 'all' || po.status === statusFilter;
      const matchesDeliveryStatus =
        deliveryStatusFilter === 'all' ||
        po.deliveryStatus === deliveryStatusFilter;

      return (
        matchesSearch && matchesType && matchesStatus && matchesDeliveryStatus
      );
    });
  }, [searchQuery, typeFilter, statusFilter, deliveryStatusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPOs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPOs = filteredPOs.slice(startIndex, endIndex);

  // Calculate stats
  const totalPOs = mockPurchaseOrders.length;
  const totalValue = mockPurchaseOrders.reduce(
    (sum, po) => sum + po.totalAmount,
    0
  );
  const pendingApproval = mockPurchaseOrders.filter(
    (po) => po.status === PurchaseOrderStatus.pending
  ).length;
  const inTransit = mockPurchaseOrders.filter(
    (po) =>
      po.deliveryStatus === DeliveryStatus.inTransit ||
      po.deliveryStatus === DeliveryStatus.scheduled
  ).length;
  const completedPOs = mockPurchaseOrders.filter(
    (po) => po.status === PurchaseOrderStatus.completed
  ).length;

  const hasActiveFilters = Boolean(
    searchQuery ||
      typeFilter !== 'all' ||
      statusFilter !== 'all' ||
      deliveryStatusFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setDeliveryStatusFilter('all');
    setCurrentPage(1);
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
              Purchase Orders
            </h1>
            <p className="mt-1 text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
              Manage vendor purchase orders and procurement
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/resources/purchase-orders/new">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Create PO
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Total POs
              </CardTitle>
              <FileText className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPOs}</div>
              <p className="text-muted-foreground text-xs">Purchase orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Total Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{(totalValue / 100_000).toFixed(1)}L
              </div>
              <p className="text-muted-foreground text-xs">Order value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Pending
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {pendingApproval}
              </div>
              <p className="text-muted-foreground text-xs">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                In Transit
              </CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {inTransit}
              </div>
              <p className="text-muted-foreground text-xs">On the way</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Completed
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {completedPOs}
              </div>
              <p className="text-muted-foreground text-xs">Fulfilled</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <SearchAndFilter
          variant="card"
          searchValue={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search by PO number, vendor name..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          filters={[
            {
              placeholder: 'Type',
              options: [
                { value: 'all', label: 'All Types' },
                { value: PurchaseOrderType.materials, label: 'Materials' },
                { value: PurchaseOrderType.equipment, label: 'Equipment' },
                { value: PurchaseOrderType.services, label: 'Services' },
                { value: PurchaseOrderType.rental, label: 'Rental' },
                { value: PurchaseOrderType.mixed, label: 'Mixed' },
              ],
              value: typeFilter,
              onChange: (value) => {
                setTypeFilter(value as PurchaseOrderType | 'all');
                setCurrentPage(1);
              },
            },
            {
              placeholder: 'Status',
              options: [
                { value: 'all', label: 'All Statuses' },
                { value: PurchaseOrderStatus.draft, label: 'Draft' },
                { value: PurchaseOrderStatus.pending, label: 'Pending' },
                { value: PurchaseOrderStatus.approved, label: 'Approved' },
                { value: PurchaseOrderStatus.sent, label: 'Sent' },
                {
                  value: PurchaseOrderStatus.acknowledged,
                  label: 'Acknowledged',
                },
                {
                  value: PurchaseOrderStatus.partiallyReceived,
                  label: 'Partially Received',
                },
                { value: PurchaseOrderStatus.received, label: 'Received' },
                { value: PurchaseOrderStatus.completed, label: 'Completed' },
                { value: PurchaseOrderStatus.cancelled, label: 'Cancelled' },
              ],
              value: statusFilter,
              onChange: (value) => {
                setStatusFilter(value as PurchaseOrderStatus | 'all');
                setCurrentPage(1);
              },
            },
            {
              placeholder: 'Delivery Status',
              options: [
                { value: 'all', label: 'All Delivery Status' },
                { value: DeliveryStatus.pending, label: 'Pending' },
                { value: DeliveryStatus.scheduled, label: 'Scheduled' },
                { value: DeliveryStatus.inTransit, label: 'In Transit' },
                {
                  value: DeliveryStatus.partiallyDelivered,
                  label: 'Partially Delivered',
                },
                { value: DeliveryStatus.delivered, label: 'Delivered' },
                { value: DeliveryStatus.delayed, label: 'Delayed' },
              ],
              value: deliveryStatusFilter,
              onChange: (value) => {
                setDeliveryStatusFilter(value as DeliveryStatus | 'all');
                setCurrentPage(1);
              },
            },
          ]}
        />

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredPOs.length)}{' '}
            of {filteredPOs.length} purchase orders
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

        {/* Purchase Orders List */}
        {filteredPOs.length > 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {paginatedPOs.map((po) => (
                  <div
                    key={po.id}
                    className="rounded-lg border p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                      {/* Left Section */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <Link
                                href={`/dashboard/resources/purchase-orders/${po.id}`}
                                className="text-lg font-semibold text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                              >
                                {po.poNumber}
                              </Link>
                              <Badge
                                className={getPOStatusBadgeColor(po.status)}
                              >
                                {purchaseOrderStatusLabels[po.status]}
                              </Badge>
                              <Badge variant="outline">
                                {purchaseOrderTypeLabels[po.type]}
                              </Badge>
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              Vendor:{' '}
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {po.vendorName}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">
                              PO Date:
                            </span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {format(po.poDate, 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">
                              Delivery:
                            </span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {po.expectedDeliveryDate
                                ? format(
                                    po.expectedDeliveryDate,
                                    'MMM dd, yyyy'
                                  )
                                : 'TBD'}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">
                              Items:
                            </span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {po.lineItems.length} item
                              {po.lineItems.length === 1 ? '' : 's'}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">
                              Delivery Status:
                            </span>
                            <Badge
                              className={`${getDeliveryStatusBadgeColor(po.deliveryStatus)} mt-1`}
                              variant="outline"
                            >
                              {deliveryStatusLabels[po.deliveryStatus]}
                            </Badge>
                          </div>
                        </div>

                        {po.advancePaymentRequired && (
                          <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            <span className="text-orange-600 dark:text-orange-400">
                              Advance Payment: {po.advancePaymentPercentage}% (₹
                              {(po.advancePaymentAmount! / 100_000).toFixed(2)}
                              L)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Section */}
                      <div className="flex flex-col gap-2 lg:items-end">
                        <div className="text-right">
                          <p className="text-sm text-zinc-500 dark:text-zinc-500">
                            Total Amount
                          </p>
                          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                            ₹{(po.totalAmount / 100_000).toFixed(2)}L
                          </p>
                          {po.discountAmount > 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Discount: ₹{(po.discountAmount / 1000).toFixed(1)}
                              K
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/dashboard/resources/purchase-orders/${po.id}`}
                        >
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
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
            <CardContent className="py-12 text-center">
              <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
              <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                {hasActiveFilters
                  ? 'No purchase orders found'
                  : 'No purchase orders yet'}
              </h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                {hasActiveFilters
                  ? "Try adjusting your filters to find what you're looking for."
                  : 'Create your first purchase order to get started.'}
              </p>
              {hasActiveFilters ? (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/dashboard/resources/purchase-orders/new">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Create Purchase Order
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
