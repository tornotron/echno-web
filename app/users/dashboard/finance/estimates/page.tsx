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
import { FileText, Plus, Clock, CheckCircle2, DollarSign } from 'lucide-react';

import { mockEstimates } from '@/components/shared/mock-data';

type EstimateStatus =
  | 'draft'
  | 'pending'
  | 'sent'
  | 'approved'
  | 'rejected'
  | 'revised'
  | 'converted'
  | 'expired'
  | 'cancelled';
type EstimateCategory =
  | 'construction'
  | 'renovation'
  | 'maintenance'
  | 'consulting'
  | 'design'
  | 'mixed';

const estimateStatusLabels: Record<EstimateStatus, string> = {
  draft: 'Draft',
  pending: 'Pending Review',
  sent: 'Sent to Client',
  approved: 'Approved',
  rejected: 'Rejected',
  revised: 'Revised',
  converted: 'Converted to Project',
  expired: 'Expired',
  cancelled: 'Cancelled',
};

const estimateCategoryLabels: Record<EstimateCategory, string> = {
  construction: 'Construction',
  renovation: 'Renovation',
  maintenance: 'Maintenance',
  consulting: 'Consulting',
  design: 'Design',
  mixed: 'Mixed',
};

const getStatusBadgeColor = (status: EstimateStatus): string => {
  const colors = {
    draft: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    pending:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    approved:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    revised:
      'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    converted:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    expired: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  };
  return colors[status];
};

export default function EstimatesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EstimateStatus | 'all'>(
    'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<
    EstimateCategory | 'all'
  >('all');

  // Filter estimates
  const filteredEstimates = useMemo(() => {
    return mockEstimates.filter((estimate) => {
      const matchesSearch =
        estimate.estimateNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        estimate.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        estimate.clientName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || estimate.status === statusFilter;
      const matchesCategory =
        categoryFilter === 'all' || estimate.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchQuery, statusFilter, categoryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredEstimates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEstimates = filteredEstimates.slice(startIndex, endIndex);

  // Calculate stats
  const totalEstimates = mockEstimates.length;
  const totalValue = mockEstimates.reduce((sum, e) => sum + e.totalAmount, 0);
  const pendingCount = mockEstimates.filter(
    (e) => e.status === 'pending' || e.status === 'sent'
  ).length;
  const approvedCount = mockEstimates.filter(
    (e) => e.status === 'approved'
  ).length;

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setCurrentPage(1);
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
              Estimates
            </h1>
            <p className="mt-1 text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
              Create and manage construction project estimates
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/users/dashboard/finance/estimates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Estimate
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Total Estimates
              </CardTitle>
              <FileText className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEstimates}</div>
              <p className="text-muted-foreground text-xs">All estimates</p>
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
                ₹{(totalValue / 10_000_000).toFixed(1)}Cr
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
                {pendingCount}
              </div>
              <p className="text-muted-foreground text-xs">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Approved
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {approvedCount}
              </div>
              <p className="text-muted-foreground text-xs">Client approved</p>
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
          searchPlaceholder="Search by estimate number, title, client..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          filters={[
            {
              placeholder: 'Status',
              options: [
                { value: 'all', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'pending', label: 'Pending Review' },
                { value: 'sent', label: 'Sent to Client' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'revised', label: 'Revised' },
                { value: 'converted', label: 'Converted to Project' },
                { value: 'expired', label: 'Expired' },
                { value: 'cancelled', label: 'Cancelled' },
              ],
              value: statusFilter,
              onChange: (value) => {
                setStatusFilter(value as EstimateStatus | 'all');
                setCurrentPage(1);
              },
            },
            {
              placeholder: 'Category',
              options: [
                { value: 'all', label: 'All Categories' },
                { value: 'construction', label: 'Construction' },
                { value: 'renovation', label: 'Renovation' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'consulting', label: 'Consulting' },
                { value: 'design', label: 'Design' },
                { value: 'mixed', label: 'Mixed' },
              ],
              value: categoryFilter,
              onChange: (value) => {
                setCategoryFilter(value as EstimateCategory | 'all');
                setCurrentPage(1);
              },
            },
          ]}
        />

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to{' '}
            {Math.min(endIndex, filteredEstimates.length)} of{' '}
            {filteredEstimates.length} estimates
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

        {/* Estimates List */}
        {filteredEstimates.length > 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {paginatedEstimates.map((estimate) => (
                  <Link
                    key={estimate.id}
                    href={`/users/dashboard/finance/estimates/${estimate.id}`}
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
                                  {estimate.estimateNumber}
                                </span>
                                <Badge
                                  className={getStatusBadgeColor(
                                    estimate.status as EstimateStatus
                                  )}
                                >
                                  {
                                    estimateStatusLabels[
                                      estimate.status as EstimateStatus
                                    ]
                                  }
                                </Badge>
                                <Badge variant="outline">
                                  {
                                    estimateCategoryLabels[
                                      estimate.category as EstimateCategory
                                    ]
                                  }
                                </Badge>
                              </div>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                {estimate.title}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                            <div>
                              <span className="text-zinc-500 dark:text-zinc-500">
                                Client:
                              </span>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {estimate.clientName}
                              </p>
                            </div>
                            <div>
                              <span className="text-zinc-500 dark:text-zinc-500">
                                Prepared:
                              </span>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {format(estimate.preparedDate, 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <div>
                              <span className="text-zinc-500 dark:text-zinc-500">
                                Valid Until:
                              </span>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {format(estimate.expiryDate, 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <div>
                              <span className="text-zinc-500 dark:text-zinc-500">
                                Validity:
                              </span>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {estimate.validityPeriod} days
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right Section */}
                        <div className="flex flex-col gap-2 lg:items-end">
                          <div className="text-right">
                            <p className="text-sm text-zinc-500 dark:text-zinc-500">
                              Total Amount
                            </p>
                            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                              ₹{(estimate.totalAmount / 100_000).toFixed(2)}L
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
              <FileText className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
              <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                {hasActiveFilters ? 'No estimates found' : 'No estimates yet'}
              </h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                {hasActiveFilters
                  ? "Try adjusting your filters to find what you're looking for."
                  : 'Create your first estimate to get started.'}
              </p>
              {hasActiveFilters ? (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/users/dashboard/finance/estimates/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Estimate
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
