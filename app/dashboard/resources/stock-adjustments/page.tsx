'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
  Settings,
  Plus,
  Clock,
  Eye,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

// Mock stock adjustments data (inline until we create proper types)
const stockAdjustments = [
  {
    id: 1,
    adjustmentId: 'SA-2024-001',
    type: 'correction',
    reason: 'stock-discrepancy',
    material: 'Cement Bags (50kg)',
    location: 'Warehouse A',
    systemQuantity: 500,
    physicalQuantity: 485,
    variance: -15,
    unit: 'bags',
    status: 'approved',
    requestedBy: 'Rajesh Kumar',
    approvedBy: 'Suresh Patel',
    adjustmentDate: '2024-03-01',
    notes: 'Physical count revealed missing bags',
  },
  {
    id: 2,
    adjustmentId: 'SA-2024-002',
    type: 'write-off',
    reason: 'damage',
    material: 'Steel Rods (12mm)',
    location: 'Site A - Building Project',
    systemQuantity: 1000,
    physicalQuantity: 980,
    variance: -20,
    unit: 'pcs',
    status: 'pending',
    requestedBy: 'Amit Patel',
    approvedBy: null,
    adjustmentDate: '2024-03-05',
    notes: 'Damaged during transport',
  },
  {
    id: 3,
    adjustmentId: 'SA-2024-003',
    type: 'found',
    reason: 'found-items',
    material: 'Power Tools Set',
    location: 'Warehouse B',
    systemQuantity: 20,
    physicalQuantity: 23,
    variance: 3,
    unit: 'sets',
    status: 'approved',
    requestedBy: 'Priya Singh',
    approvedBy: 'Suresh Patel',
    adjustmentDate: '2024-02-28',
    notes: 'Found during inventory check',
  },
  {
    id: 4,
    adjustmentId: 'SA-2024-004',
    type: 'correction',
    reason: 'counting-error',
    material: 'Paint Cans (20L)',
    location: 'Warehouse A',
    systemQuantity: 150,
    physicalQuantity: 155,
    variance: 5,
    unit: 'cans',
    status: 'rejected',
    requestedBy: 'Neha Sharma',
    approvedBy: 'Suresh Patel',
    adjustmentDate: '2024-03-02',
    notes: 'Recounting required',
  },
  {
    id: 5,
    adjustmentId: 'SA-2024-005',
    type: 'write-off',
    reason: 'expiry',
    material: 'Adhesive Bottles (1L)',
    location: 'Warehouse B',
    systemQuantity: 80,
    physicalQuantity: 70,
    variance: -10,
    unit: 'bottles',
    status: 'draft',
    requestedBy: 'Vikram Reddy',
    approvedBy: null,
    adjustmentDate: null,
    notes: 'Expired stock to be written off',
  },
];

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
    return stockAdjustments.filter((adjustment) => {
      const matchesSearch =
        adjustment.adjustmentId
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        adjustment.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adjustment.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        typeFilter === 'all' || adjustment.type === typeFilter;
      const matchesStatus =
        statusFilter === 'all' || adjustment.status === statusFilter;
      const matchesReason =
        reasonFilter === 'all' || adjustment.reason === reasonFilter;

      return matchesSearch && matchesType && matchesStatus && matchesReason;
    });
  }, [searchQuery, typeFilter, statusFilter, reasonFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAdjustments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAdjustments = filteredAdjustments.slice(startIndex, endIndex);

  // Calculate stats
  const totalAdjustments = stockAdjustments.length;
  const pendingAdjustments = stockAdjustments.filter(
    (a) => a.status === 'pending'
  ).length;
  const positiveVariance = stockAdjustments
    .filter((a) => a.variance > 0)
    .reduce((sum, a) => sum + a.variance, 0);
  const negativeVariance = Math.abs(
    stockAdjustments
      .filter((a) => a.variance < 0)
      .reduce((sum, a) => sum + a.variance, 0)
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
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
              Stock Adjustments
            </h1>
            <p className="mt-1 text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
              Manage stock corrections and adjustments
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/resources/stock-adjustments/new">
              <Plus className="mr-2 h-4 w-4" />
              New Adjustment
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Total Adjustments
              </CardTitle>
              <FileText className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAdjustments}</div>
              <p className="text-muted-foreground text-xs">All adjustments</p>
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
                {pendingAdjustments}
              </div>
              <p className="text-muted-foreground text-xs">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Surplus
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{positiveVariance}
              </div>
              <p className="text-muted-foreground text-xs">Items found</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Shortage
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                -{negativeVariance}
              </div>
              <p className="text-muted-foreground text-xs">Items missing</p>
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
                  <div
                    key={adj.id}
                    className="rounded-lg border p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                      {/* Left Section */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <Link
                                href={`/dashboard/resources/stock-adjustments/${adj.id}`}
                                className="text-lg font-semibold text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                              >
                                {adj.adjustmentId}
                              </Link>
                              <Badge
                                className={getStatusBadgeColor(adj.status)}
                              >
                                {adj.status.charAt(0).toUpperCase() +
                                  adj.status.slice(1)}
                              </Badge>
                              <Badge variant="outline">
                                {adj.type
                                  .split('-')
                                  .map(
                                    (w) =>
                                      w.charAt(0).toUpperCase() + w.slice(1)
                                  )
                                  .join(' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              Material:{' '}
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {adj.material}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">
                              Location:
                            </span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {adj.location}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">
                              System Qty:
                            </span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {adj.systemQuantity} {adj.unit}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">
                              Physical Qty:
                            </span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {adj.physicalQuantity} {adj.unit}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">
                              Variance:
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                adj.variance > 0
                                  ? 'text-green-600'
                                  : adj.variance < 0
                                    ? 'text-red-600'
                                    : ''
                              }
                            >
                              {adj.variance > 0 ? '+' : ''}
                              {adj.variance} {adj.unit}
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
                            {adj.reason
                              .split('-')
                              .map(
                                (w) => w.charAt(0).toUpperCase() + w.slice(1)
                              )
                              .join(' ')}
                          </p>
                        </div>
                        <Link
                          href={`/dashboard/resources/stock-adjustments/${adj.id}`}
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
              <Settings className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
              <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                {hasActiveFilters
                  ? 'No stock adjustments found'
                  : 'No stock adjustments yet'}
              </h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                {hasActiveFilters
                  ? "Try adjusting your filters to find what you're looking for."
                  : 'Create your first stock adjustment to get started.'}
              </p>
              {hasActiveFilters ? (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/dashboard/resources/stock-adjustments/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Adjustment
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
