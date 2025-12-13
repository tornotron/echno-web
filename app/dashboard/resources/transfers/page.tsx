'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/common/app-layout';
import { FiltersCard } from '@/components/common/filters-card';
import { Pagination } from '@/components/common/pagination';
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
  Eye,
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
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    in_transit: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
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
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TransferPriority | 'all'>('all');

  // Filter transfers
  const filteredTransfers = useMemo(() => {
    return mockTransfers.filter((transfer) => {
      const matchesSearch = 
        transfer.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transfer.lineItems.some(item => item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || transfer.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || transfer.priority === priorityFilter;

      return matchesSearch && matchesType && matchesStatus && matchesPriority;
    });
  }, [searchQuery, typeFilter, statusFilter, priorityFilter]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, statusFilter, priorityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransfers = filteredTransfers.slice(startIndex, endIndex);

  // Calculate stats
  const totalTransfers = mockTransfers.length;
  const totalValue = mockTransfers.reduce((sum, t) => sum + t.totalValue, 0);
  const pendingApproval = mockTransfers.filter(t => t.status === TransferStatus.pending).length;
  const inTransit = mockTransfers.filter(t => t.status === TransferStatus.inTransit).length;
  const completed = mockTransfers.filter(t => t.status === TransferStatus.completed).length;

  const hasActiveFilters =
    searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCurrentPage(1);
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Transfers
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1">
              Manage material and asset transfers between locations
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/resources/transfers/new">
              <Plus className="mr-2 h-4 w-4" />
              New Transfer
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Transfers</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTransfers}</div>
              <p className="text-xs text-muted-foreground">All transfers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(totalValue / 100000).toFixed(1)}L</div>
              <p className="text-xs text-muted-foreground">Estimated value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingApproval}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{inTransit}</div>
              <p className="text-xs text-muted-foreground">On the way</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completed}</div>
              <p className="text-xs text-muted-foreground">Delivered</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FiltersCard
            title="Search & Filters"
            searchPlaceholder="Search by transfer number, location..."
            searchValue={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:flex-1 sm:min-w-[200px]">
                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    setTypeFilter(value as TransferType | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={TransferType.locationToLocation}>Location to Location</SelectItem>
                    <SelectItem value={TransferType.projectToProject}>Project to Project</SelectItem>
                    <SelectItem value={TransferType.returnToStock}>Return to Stock</SelectItem>
                    <SelectItem value={TransferType.disposal}>Disposal</SelectItem>
                    <SelectItem value={TransferType.temporary}>Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:flex-1 sm:min-w-[200px]">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as TransferStatus | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={TransferStatus.draft}>Draft</SelectItem>
                    <SelectItem value={TransferStatus.pending}>Pending</SelectItem>
                    <SelectItem value={TransferStatus.approved}>Approved</SelectItem>
                    <SelectItem value={TransferStatus.inTransit}>In Transit</SelectItem>
                    <SelectItem value={TransferStatus.completed}>Completed</SelectItem>
                    <SelectItem value={TransferStatus.rejected}>Rejected</SelectItem>
                    <SelectItem value={TransferStatus.cancelled}>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:flex-1 sm:min-w-[200px]">
                <Select
                  value={priorityFilter}
                  onValueChange={(value) => {
                    setPriorityFilter(value as TransferPriority | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value={TransferPriority.low}>Low</SelectItem>
                    <SelectItem value={TransferPriority.medium}>Medium</SelectItem>
                    <SelectItem value={TransferPriority.high}>High</SelectItem>
                    <SelectItem value={TransferPriority.urgent}>Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="mt-2"
              >
                Clear Filters
              </Button>
            )}
          </FiltersCard>
        </div>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredTransfers.length)} of{' '}
            {filteredTransfers.length} transfers
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Rows per page:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value));
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
                  <div
                    key={transfer.id}
                    className="border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left Section */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Link
                                href={`/dashboard/resources/transfers/${transfer.id}`}
                                className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                {transfer.transferNumber}
                              </Link>
                              <Badge className={getStatusBadgeColor(transfer.status)}>
                                {transferStatusLabels[transfer.status]}
                              </Badge>
                              <Badge variant="outline">
                                {transferTypeLabels[transfer.type]}
                              </Badge>
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              Transfer: <span className="font-medium text-zinc-900 dark:text-zinc-100">{transfer.lineItems.map(item => item.description).join(', ')}</span>
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Request Date:</span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {format(transfer.requestDate, 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Expected:</span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {transfer.expectedDeliveryDate ? format(transfer.expectedDeliveryDate, 'MMM dd, yyyy') : 'TBD'}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Items:</span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {transfer.lineItems.length} item{transfer.lineItems.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Priority:</span>
                            <Badge className={`${getPriorityBadgeColor(transfer.priority)} mt-1`} variant="outline">
                              {transferPriorityLabels[transfer.priority]}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Right Section */}
                      <div className="flex flex-col lg:items-end gap-2">
                        <div className="text-right">
                          <p className="text-sm text-zinc-500 dark:text-zinc-500">Total Value</p>
                          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                            ₹{(transfer.totalValue / 100000).toFixed(2)}L
                          </p>
                        </div>
                        <Link href={`/dashboard/resources/transfers/${transfer.id}`}>
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
            <CardContent className="text-center py-12">
              <ArrowRightLeft className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                {hasActiveFilters ? 'No transfers found' : 'No transfers yet'}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Create your first transfer to get started.'}
              </p>
              {hasActiveFilters ? (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/dashboard/resources/transfers/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Transfer
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
