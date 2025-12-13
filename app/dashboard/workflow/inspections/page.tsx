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
  ClipboardCheck,
  Plus,
  Eye,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  InspectionStatus,
  InspectionType,
  InspectionResult,
  inspectionStatusLabels,
  inspectionTypeLabels,
  inspectionResultLabels,
} from '@/types/inspection';

// Mock data - replace with actual API call
const mockInspections = [
  {
    id: 1,
    inspectionNumber: 'INS-2024-0001',
    title: 'Foundation Quality Inspection',
    type: 'quality' as InspectionType,
    status: 'completed' as InspectionStatus,
    result: 'passed' as InspectionResult,
    scheduledDate: new Date('2024-11-08'),
    location: 'Building A - Ground Floor',
    inspectorName: 'John Smith',
    compliancePercentage: 98,
    defectsFound: 2,
    criticalDefects: 0,
  },
  {
    id: 2,
    inspectionNumber: 'INS-2024-0002',
    title: 'Electrical Safety Check',
    type: 'electrical' as InspectionType,
    status: 'in-progress' as InspectionStatus,
    result: 'pending' as InspectionResult,
    scheduledDate: new Date('2024-11-10'),
    location: 'Building B - 2nd Floor',
    inspectorName: 'Sarah Johnson',
    compliancePercentage: 85,
    defectsFound: 5,
    criticalDefects: 1,
  },
  {
    id: 3,
    inspectionNumber: 'INS-2024-0003',
    title: 'Structural Integrity Assessment',
    type: 'structural' as InspectionType,
    status: 'scheduled' as InspectionStatus,
    result: 'pending' as InspectionResult,
    scheduledDate: new Date('2024-11-12'),
    location: 'Building C - 3rd Floor',
    inspectorName: 'Mike Davis',
    compliancePercentage: 0,
    defectsFound: 0,
    criticalDefects: 0,
  },
];

const getStatusBadgeColor = (status: InspectionStatus): string => {
  const colors = {
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    'in-progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    completed: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    passed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    'passed-with-remarks': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  };
  return colors[status];
};

const getResultBadgeColor = (result: InspectionResult): string => {
  const colors = {
    passed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    'passed-with-remarks': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    pending: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
  };
  return colors[result];
};

export default function InspectionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<InspectionType | 'all'>('all');
  const [resultFilter, setResultFilter] = useState<InspectionResult | 'all'>('all');

  // Filter inspections
  const filteredInspections = useMemo(() => {
    return mockInspections.filter((inspection) => {
      const matchesSearch = 
        inspection.inspectionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inspection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inspection.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inspection.inspectorName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter;
      const matchesType = typeFilter === 'all' || inspection.type === typeFilter;
      const matchesResult = resultFilter === 'all' || inspection.result === resultFilter;

      return matchesSearch && matchesStatus && matchesType && matchesResult;
    });
  }, [searchQuery, statusFilter, typeFilter, resultFilter]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, resultFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInspections = filteredInspections.slice(startIndex, endIndex);

  // Calculate stats
  const totalInspections = mockInspections.length;
  const scheduledCount = mockInspections.filter(i => i.status === 'scheduled').length;
  const inProgressCount = mockInspections.filter(i => i.status === 'in-progress').length;
  const completedCount = mockInspections.filter(i => i.status === 'completed' || i.status === 'passed' || i.status === 'failed').length;
  const criticalDefectsCount = mockInspections.reduce((sum, i) => sum + i.criticalDefects, 0);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || resultFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setResultFilter('all');
    setCurrentPage(1);
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Work Inspection Reports
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1">
              Track and manage construction site inspections
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/workflow/inspections/new">
              <Plus className="mr-2 h-4 w-4" />
              New Inspection
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Inspections</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInspections}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{scheduledCount}</div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{inProgressCount}</div>
              <p className="text-xs text-muted-foreground">Active now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Critical Defects</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalDefectsCount}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div>
          <FiltersCard
            title="Search & Filters"
            searchPlaceholder="Search by number, title, location, inspector..."
            searchValue={searchQuery}
            onSearchChange={(value: string) => {
              setSearchQuery(value);
              setCurrentPage(1);
            }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:flex-1 sm:min-w-[180px]">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as InspectionStatus | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="passed-with-remarks">Passed with Remarks</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:flex-1 sm:min-w-[180px]">
                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    setTypeFilter(value as InspectionType | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="finishing">Finishing</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:flex-1 sm:min-w-[180px]">
                <Select
                  value={resultFilter}
                  onValueChange={(value) => {
                    setResultFilter(value as InspectionResult | 'all');
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Results" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="passed-with-remarks">Passed with Remarks</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
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
            Showing {startIndex + 1} to {Math.min(endIndex, filteredInspections.length)} of{' '}
            {filteredInspections.length} inspections
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

        {/* Inspections List */}
        {filteredInspections.length > 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {paginatedInspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className="border rounded-lg p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left Section */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Link
                                href={`/dashboard/workflow/inspections/${inspection.id}`}
                                className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400"
                              >
                                {inspection.inspectionNumber}
                              </Link>
                              <Badge className={getStatusBadgeColor(inspection.status)}>
                                {inspectionStatusLabels[inspection.status]}
                              </Badge>
                              <Badge variant="outline">
                                {inspectionTypeLabels[inspection.type]}
                              </Badge>
                              {inspection.result !== 'pending' && (
                                <Badge className={getResultBadgeColor(inspection.result)}>
                                  {inspectionResultLabels[inspection.result]}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              {inspection.title}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Location:</span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {inspection.location}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Inspector:</span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {inspection.inspectorName}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Date:</span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {format(inspection.scheduledDate, 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Defects:</span>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {inspection.defectsFound} 
                              {inspection.criticalDefects > 0 && (
                                <span className="text-red-600 ml-1">
                                  ({inspection.criticalDefects} critical)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Section */}
                      <div className="flex flex-col lg:items-end gap-2">
                        {inspection.status !== 'scheduled' && (
                          <div className="text-right">
                            <p className="text-sm text-zinc-500 dark:text-zinc-500">Compliance</p>
                            <p className={`text-xl font-bold ${
                              inspection.compliancePercentage >= 95 ? 'text-green-600' :
                              inspection.compliancePercentage >= 80 ? 'text-orange-600' :
                              'text-red-600'
                            }`}>
                              {inspection.compliancePercentage}%
                            </p>
                          </div>
                        )}
                        <Link href={`/dashboard/workflow/inspections/${inspection.id}`}>
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
              <ClipboardCheck className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                {hasActiveFilters ? 'No inspections found' : 'No inspections yet'}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Schedule your first inspection to get started.'}
              </p>
              {hasActiveFilters ? (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/dashboard/workflow/inspections/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule Inspection
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
