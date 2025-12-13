'use client';

import { useState } from 'react';
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
  Package,
  Plus,
  Clock,
  AlertCircle,
  Eye,
  FileText,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import {
  MaterialRequestType,
  MaterialRequestStatus,
  MaterialRequestPriority,
  materialRequestTypeLabels,
  materialRequestStatusLabels,
  materialRequestPriorityLabels,
} from '@/types/resource/material-request';
import { mockMaterialRequests } from '@/components/shared/mock-data';

// Helper functions for badge colors
const getStatusBadgeColor = (status: MaterialRequestStatus): string => {
  const colors = {
    draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    under_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    partially_fulfilled: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    fulfilled: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  };
  return colors[status];
};

const getPriorityBadgeColor = (priority: MaterialRequestPriority): string => {
  const colors = {
    low: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    critical: 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200',
  };
  return colors[priority];
};

export default function MaterialRequestsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<MaterialRequestType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<MaterialRequestStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<MaterialRequestPriority | 'all'>('all');

  // Filter material requests
  const filteredRequests = useMemo(() => {
    return mockMaterialRequests.filter((mr) => {
      const matchesSearch = 
        mr.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mr.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mr.lineItems.some(item => item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || mr.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || mr.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || mr.priority === priorityFilter;

      return matchesSearch && matchesType && matchesStatus && matchesPriority;
    });
  }, [searchQuery, typeFilter, statusFilter, priorityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Calculate stats
  const totalRequests = mockMaterialRequests.length;
  const totalValue = mockMaterialRequests.reduce((sum, mr) => sum + mr.estimatedTotalCost, 0);
  const pendingApproval = mockMaterialRequests.filter(mr => 
    mr.status === MaterialRequestStatus.submitted || mr.status === MaterialRequestStatus.underReview
  ).length;
  const partiallyFulfilled = mockMaterialRequests.filter(mr => 
    mr.status === MaterialRequestStatus.partiallyFulfilled
  ).length;

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
              Material Requests
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1">
              Request and manage materials for projects and operations
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/resources/material-requests/new">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests}</div>
              <p className="text-xs text-muted-foreground">Material requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(totalValue / 100_000).toFixed(1)}L</div>
              <p className="text-xs text-muted-foreground">Estimated value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingApproval}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Partially Fulfilled</CardTitle>
              <AlertCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{partiallyFulfilled}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FiltersCard
            title="Search & Filters"
            searchPlaceholder="Search by request number, purpose..."
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
                    setTypeFilter(value as MaterialRequestType | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={MaterialRequestType.project}>Project</SelectItem>
                    <SelectItem value={MaterialRequestType.maintenance}>Maintenance</SelectItem>
                    <SelectItem value={MaterialRequestType.emergency}>Emergency</SelectItem>
                    <SelectItem value={MaterialRequestType.replenishment}>Replenishment</SelectItem>
                    <SelectItem value={MaterialRequestType.other}>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:flex-1 sm:min-w-[200px]">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as MaterialRequestStatus | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={MaterialRequestStatus.draft}>Draft</SelectItem>
                    <SelectItem value={MaterialRequestStatus.submitted}>Submitted</SelectItem>
                    <SelectItem value={MaterialRequestStatus.underReview}>Under Review</SelectItem>
                    <SelectItem value={MaterialRequestStatus.approved}>Approved</SelectItem>
                    <SelectItem value={MaterialRequestStatus.rejected}>Rejected</SelectItem>
                    <SelectItem value={MaterialRequestStatus.partiallyFulfilled}>Partially Fulfilled</SelectItem>
                    <SelectItem value={MaterialRequestStatus.fulfilled}>Fulfilled</SelectItem>
                    <SelectItem value={MaterialRequestStatus.cancelled}>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:flex-1 sm:min-w-[200px]">
                <Select
                  value={priorityFilter}
                  onValueChange={(value) => {
                    setPriorityFilter(value as MaterialRequestPriority | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value={MaterialRequestPriority.low}>Low</SelectItem>
                    <SelectItem value={MaterialRequestPriority.medium}>Medium</SelectItem>
                    <SelectItem value={MaterialRequestPriority.high}>High</SelectItem>
                    <SelectItem value={MaterialRequestPriority.urgent}>Urgent</SelectItem>
                    <SelectItem value={MaterialRequestPriority.critical}>Critical</SelectItem>
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredRequests.length)} of{' '}
            {filteredRequests.length} material requests
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Rows per page:</span>
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

        {/* Material Requests List */}
        {filteredRequests.length > 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {paginatedRequests.map((mr) => (
                  <div
                    key={mr.id}
                    className="border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left Section */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Link
                                href={`/dashboard/resources/material-requests/${mr.id}`}
                                className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                {mr.requestNumber}
                              </Link>
                              <Badge className={getStatusBadgeColor(mr.status)}>
                                {materialRequestStatusLabels[mr.status]}
                              </Badge>
                              <Badge variant="outline">
                                {materialRequestTypeLabels[mr.type]}
                              </Badge>
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              Purpose: <span className="font-medium text-zinc-900 dark:text-zinc-100">{mr.purpose}</span>
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Request Date:</span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {format(mr.requestDate, 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Required By:</span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {format(mr.requiredByDate, 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Items:</span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {mr.lineItems.length} item{mr.lineItems.length === 1 ? '' : 's'}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Priority:</span>
                            <Badge className={`${getPriorityBadgeColor(mr.priority)} mt-1`} variant="outline">
                              {materialRequestPriorityLabels[mr.priority]}
                            </Badge>
                          </div>
                        </div>

                        {mr.status === MaterialRequestStatus.partiallyFulfilled && (
                          <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            <span className="text-orange-600 dark:text-orange-400">
                              Partially fulfilled - {mr.lineItems.filter(item => item.quantityPending > 0).length} items pending
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Section */}
                      <div className="flex flex-col lg:items-end gap-2">
                        <div className="text-right">
                          <p className="text-sm text-zinc-500 dark:text-zinc-500">Estimated Cost</p>
                          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                            ₹{(mr.estimatedTotalCost / 100_000).toFixed(2)}L
                          </p>
                          {mr.actualTotalCost && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Actual: ₹{(mr.actualTotalCost / 1000).toFixed(1)}K
                            </p>
                          )}
                        </div>
                        <Link href={`/dashboard/resources/material-requests/${mr.id}`}>
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
              <Package className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                {hasActiveFilters ? 'No material requests found' : 'No material requests yet'}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Create your first material request to get started.'}
              </p>
              {hasActiveFilters ? (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/dashboard/resources/material-requests/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Material Request
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
