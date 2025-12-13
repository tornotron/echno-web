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
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

// Mock data - replace with actual API call
const mockEstimates = [
  {
    id: 1,
    estimateNumber: 'EST-2024-0001',
    title: 'Residential Building Construction',
    clientName: 'John Doe',
    status: 'approved',
    category: 'construction',
    preparedDate: new Date('2024-11-01'),
    expiryDate: new Date('2024-12-01'),
    totalAmount: 5500000,
    validityPeriod: 30,
  },
  {
    id: 2,
    estimateNumber: 'EST-2024-0002',
    title: 'Office Renovation Project',
    clientName: 'ABC Corp',
    status: 'sent',
    category: 'renovation',
    preparedDate: new Date('2024-11-05'),
    expiryDate: new Date('2024-12-05'),
    totalAmount: 2800000,
    validityPeriod: 30,
  },
];

type EstimateStatus = 'draft' | 'pending' | 'sent' | 'approved' | 'rejected' | 'revised' | 'converted' | 'expired' | 'cancelled';
type EstimateCategory = 'construction' | 'renovation' | 'maintenance' | 'consulting' | 'design' | 'mixed';

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
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    revised: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    converted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    expired: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  };
  return colors[status];
};

export default function EstimatesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EstimateStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<EstimateCategory | 'all'>('all');

  // Filter estimates
  const filteredEstimates = useMemo(() => {
    return mockEstimates.filter((estimate) => {
      const matchesSearch = 
        estimate.estimateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        estimate.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        estimate.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || estimate.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || estimate.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchQuery, statusFilter, categoryFilter]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredEstimates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEstimates = filteredEstimates.slice(startIndex, endIndex);

  // Calculate stats
  const totalEstimates = mockEstimates.length;
  const totalValue = mockEstimates.reduce((sum, e) => sum + e.totalAmount, 0);
  const pendingCount = mockEstimates.filter(e => e.status === 'pending' || e.status === 'sent').length;
  const approvedCount = mockEstimates.filter(e => e.status === 'approved').length;

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all';

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Estimates
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1">
              Create and manage construction project estimates
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/finance/estimates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Estimate
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Estimates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEstimates}</div>
              <p className="text-xs text-muted-foreground">All estimates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(totalValue / 10000000).toFixed(1)}Cr</div>
              <p className="text-xs text-muted-foreground">Estimated value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">Client approved</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div>
          <FiltersCard
            title="Search & Filters"
            searchPlaceholder="Search by estimate number, title, client..."
            searchValue={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:flex-1 sm:min-w-[200px]">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as EstimateStatus | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="sent">Sent to Client</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="revised">Revised</SelectItem>
                    <SelectItem value="converted">Converted to Project</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:flex-1 sm:min-w-[200px]">
                <Select
                  value={categoryFilter}
                  onValueChange={(value) => {
                    setCategoryFilter(value as EstimateCategory | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="renovation">Renovation</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredEstimates.length)} of{' '}
            {filteredEstimates.length} estimates
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

        {/* Estimates List */}
        {filteredEstimates.length > 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {paginatedEstimates.map((estimate) => (
                  <div
                    key={estimate.id}
                    className="border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left Section */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Link
                                href={`/dashboard/finance/estimates/${estimate.id}`}
                                className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                {estimate.estimateNumber}
                              </Link>
                              <Badge className={getStatusBadgeColor(estimate.status as EstimateStatus)}>
                                {estimateStatusLabels[estimate.status as EstimateStatus]}
                              </Badge>
                              <Badge variant="outline">
                                {estimateCategoryLabels[estimate.category as EstimateCategory]}
                              </Badge>
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              {estimate.title}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Client:</span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {estimate.clientName}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Prepared:</span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {format(estimate.preparedDate, 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Valid Until:</span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {format(estimate.expiryDate, 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Validity:</span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {estimate.validityPeriod} days
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Section */}
                      <div className="flex flex-col lg:items-end gap-2">
                        <div className="text-right">
                          <p className="text-sm text-zinc-500 dark:text-zinc-500">Total Amount</p>
                          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                            ₹{(estimate.totalAmount / 100000).toFixed(2)}L
                          </p>
                        </div>
                        <Link href={`/dashboard/finance/estimates/${estimate.id}`}>
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
              <FileText className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                {hasActiveFilters ? 'No estimates found' : 'No estimates yet'}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Create your first estimate to get started.'}
              </p>
              {hasActiveFilters ? (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/dashboard/finance/estimates/new">
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
