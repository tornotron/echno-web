'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination, SearchAndFilter } from '@/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRightLeft,
  Plus,
  Clock,
  FileText,
  TrendingUp,
  CheckCircle2,
  Truck,
} from 'lucide-react';
import {
  TransferType,
  TransferStatus,
  TransferPriority,
  transferTypeLabels,
  transferStatusLabels,
  transferPriorityLabels,
} from '@/types/resource/transfer';
import { mockTransfers } from '@/components/shared/mock-data';

// Helper functions for badge colors
const getStatusBadgeColor = (status: TransferStatus): string => {
  const colors = {
    draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    pending:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    approved:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    in_transit: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    completed:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return colors[status];
};

const getPriorityBadgeColor = (priority: TransferPriority): string => {
  const colors = {
    low: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  return colors[priority];
};

export default function TransfersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransferType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'all'>(
    'all'
  );
  const [priorityFilter, setPriorityFilter] = useState<
    TransferPriority | 'all'
  >('all');

  // Filter transfers
  const filteredTransfers = useMemo(() => {
    return mockTransfers.filter((transfer) => {
      const matchesSearch =
        transfer.transferNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        transfer.lineItems.some((item) =>
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesType = typeFilter === 'all' || transfer.type === typeFilter;
      const matchesStatus =
        statusFilter === 'all' || transfer.status === statusFilter;
      const matchesPriority =
        priorityFilter === 'all' || transfer.priority === priorityFilter;

      return matchesSearch && matchesType && matchesStatus && matchesPriority;
    });
  }, [searchQuery, typeFilter, statusFilter, priorityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransfers = filteredTransfers.slice(startIndex, endIndex);

  // Calculate stats
  const totalTransfers = mockTransfers.length;
  const totalValue = mockTransfers.reduce((sum, t) => sum + t.totalValue, 0);
  const pendingApproval = mockTransfers.filter(
    (t) => t.status === TransferStatus.pending
  ).length;
  const inTransit = mockTransfers.filter(
    (t) => t.status === TransferStatus.inTransit
  ).length;
  const completed = mockTransfers.filter(
    (t) => t.status === TransferStatus.completed
  ).length;

  const hasActiveFilters = Boolean(
    searchQuery ||
      typeFilter !== 'all' ||
      statusFilter !== 'all' ||
      priorityFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
            Transfers
          </h1>
          <p className="mt-1 text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
            Manage material and asset transfers between locations
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/users/dashboard/resources/transfers/new">
            <Plus className="mr-2 h-4 w-4" />
            New Transfer
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Total Transfers
            </CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransfers}</div>
            <p className="text-muted-foreground text-xs">All transfers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Total Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(totalValue / 100_000).toFixed(1)}L
            </div>
            <p className="text-muted-foreground text-xs">Estimated value</p>
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
            <Truck className="h-4 w-4 text-purple-600" />
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
            <div className="text-2xl font-bold text-green-600">{completed}</div>
            <p className="text-muted-foreground text-xs">Delivered</p>
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
        searchPlaceholder="Search by transfer number, location..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Type',
            options: [
              { value: 'all', label: 'All Types' },
              {
                value: TransferType.locationToLocation,
                label: 'Location to Location',
              },
              {
                value: TransferType.projectToProject,
                label: 'Project to Project',
              },
              { value: TransferType.returnToStock, label: 'Return to Stock' },
              { value: TransferType.disposal, label: 'Disposal' },
              { value: TransferType.temporary, label: 'Temporary' },
            ],
            value: typeFilter,
            onChange: (value) => {
              setTypeFilter(value as TransferType | 'all');
              setCurrentPage(1);
            },
          },
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: TransferStatus.draft, label: 'Draft' },
              { value: TransferStatus.pending, label: 'Pending' },
              { value: TransferStatus.approved, label: 'Approved' },
              { value: TransferStatus.inTransit, label: 'In Transit' },
              { value: TransferStatus.completed, label: 'Completed' },
              { value: TransferStatus.rejected, label: 'Rejected' },
              { value: TransferStatus.cancelled, label: 'Cancelled' },
            ],
            value: statusFilter,
            onChange: (value) => {
              setStatusFilter(value as TransferStatus | 'all');
              setCurrentPage(1);
            },
          },
          {
            placeholder: 'Priority',
            options: [
              { value: 'all', label: 'All Priorities' },
              { value: TransferPriority.low, label: 'Low' },
              { value: TransferPriority.medium, label: 'Medium' },
              { value: TransferPriority.high, label: 'High' },
              { value: TransferPriority.urgent, label: 'Urgent' },
            ],
            value: priorityFilter,
            onChange: (value) => {
              setPriorityFilter(value as TransferPriority | 'all');
              setCurrentPage(1);
            },
          },
        ]}
      />

      {/* Results Summary */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {startIndex + 1} to{' '}
          {Math.min(endIndex, filteredTransfers.length)} of{' '}
          {filteredTransfers.length} transfers
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

      {/* Transfers List */}
      {filteredTransfers.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {paginatedTransfers.map((transfer) => (
                <Link
                  key={transfer.id}
                  href={`/users/dashboard/resources/transfers/${transfer.id}`}
                  className="block"
                >
                  <div className="rounded-lg border p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                      {/* Left Section */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                                {transfer.transferNumber}
                              </span>
                              <Badge
                                className={getStatusBadgeColor(transfer.status)}
                              >
                                {transferStatusLabels[transfer.status]}
                              </Badge>
                              <Badge variant="outline">
                                {transferTypeLabels[transfer.type]}
                              </Badge>
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              Transfer:{' '}
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {transfer.lineItems
                                  .map((item) => item.description)
                                  .join(', ')}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">
                              Request Date:
                            </span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {format(transfer.requestDate, 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">
                              Expected:
                            </span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {transfer.expectedDeliveryDate
                                ? format(
                                    transfer.expectedDeliveryDate,
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
                              {transfer.lineItems.length} item
                              {transfer.lineItems.length === 1 ? '' : 's'}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">
                              Priority:
                            </span>
                            <Badge
                              className={`${getPriorityBadgeColor(transfer.priority)} mt-1`}
                              variant="outline"
                            >
                              {transferPriorityLabels[transfer.priority]}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Right Section */}
                      <div className="flex flex-col gap-2 lg:items-end">
                        <div className="text-right">
                          <p className="text-sm text-zinc-500 dark:text-zinc-500">
                            Total Value
                          </p>
                          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                            ₹{(transfer.totalValue / 100_000).toFixed(2)}L
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
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
            <ArrowRightLeft className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              {hasActiveFilters ? 'No transfers found' : 'No transfers yet'}
            </h3>
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              {hasActiveFilters
                ? "Try adjusting your filters to find what you're looking for."
                : 'Create your first transfer to get started.'}
            </p>
            {hasActiveFilters ? (
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            ) : (
              <Button asChild>
                <Link href="/users/dashboard/resources/transfers/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Transfer
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
