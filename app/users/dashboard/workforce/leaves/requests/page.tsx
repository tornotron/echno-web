'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Pagination, SearchAndFilter } from '@/components/common';
import { LeaveStatusBadge } from '@/features/leave/components/leave-status-badge';
import { StatCard } from '@/features/leave/components/stat-card';
import { TableSkeleton } from '@/features/leave/components/skeletons';
import { EmptyState } from '@/features/leave/components/empty-state';
import { useEmployeeRequests } from '@/hooks/leave/use-leave';
import { LeaveStatus } from '@/types/leave';
import { useCurrentUserEmployee } from '@/hooks/employee';
import { FileText, Plus, AlertCircle, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function MyRequestsPage() {
  const router = useRouter();
  const { data: employee, isLoading: employeeLoading } =
    useCurrentUserEmployee();
  const employeeId = employee?.id || 0;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: requests, isLoading, error } = useEmployeeRequests(employeeId);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return (requests || []).filter((request) => {
      const matchesSearch =
        searchQuery === '' ||
        request.leaveTypeName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        request.requestNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        request.reason.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || request.status === statusFilter;

      const matchesYear =
        yearFilter === 'all' ||
        new Date(request.startDate).getFullYear().toString() === yearFilter;

      return matchesSearch && matchesStatus && matchesYear;
    });
  }, [requests, searchQuery, statusFilter, yearFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Statistics
  const totalRequests = requests?.length || 0;
  const draftCount =
    requests?.filter((r) => r.status === LeaveStatus.DRAFT).length || 0;
  const pendingCount =
    requests?.filter((r) => r.status === LeaveStatus.PENDING_APPROVAL).length ||
    0;
  const approvedCount =
    requests?.filter((r) => r.status === LeaveStatus.APPROVED).length || 0;
  const rejectedCount =
    requests?.filter((r) => r.status === LeaveStatus.REJECTED).length || 0;

  const hasActiveFilters = Boolean(
    searchQuery ||
      statusFilter !== 'all' ||
      yearFilter !== new Date().getFullYear().toString()
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setYearFilter(new Date().getFullYear().toString());
    setCurrentPage(1);
  };

  if (employeeLoading) {
    return <TableSkeleton statCount={5} />;
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold">Error Loading Requests</h2>
        <p className="text-muted-foreground">
          Failed to load leave requests. Please try again later.
        </p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-yellow-500" />
        <h2 className="mb-2 text-xl font-semibold">
          Employee Profile Not Found
        </h2>
        <p className="text-muted-foreground">
          Please ensure your employee profile is set up correctly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground mb-2 text-3xl font-bold">
            My Leave Requests
          </h1>
          <p className="text-muted-foreground">
            View and manage all your leave requests
          </p>
        </div>
        <Button
          onClick={() => router.push('/users/dashboard/workforce/leaves/apply')}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Total Requests"
          value={totalRequests}
          color="blue"
        />
        <StatCard
          icon={FileText}
          label="Draft"
          value={draftCount}
          color="gray"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={pendingCount}
          color="yellow"
        />
        <StatCard
          icon={Calendar}
          label="Approved"
          value={approvedCount}
          color="green"
        />
        <StatCard
          icon={AlertCircle}
          label="Rejected"
          value={rejectedCount}
          color="red"
        />
      </div>

      {/* Search and Filters */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by leave type, request number, or reason..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: LeaveStatus.DRAFT, label: 'Draft' },
              {
                value: LeaveStatus.PENDING_APPROVAL,
                label: 'Pending Approval',
              },
              { value: LeaveStatus.APPROVED, label: 'Approved' },
              { value: LeaveStatus.REJECTED, label: 'Rejected' },
              { value: LeaveStatus.CANCELLED, label: 'Cancelled' },
              { value: LeaveStatus.WITHDRAWN, label: 'Withdrawn' },
            ],
            value: statusFilter,
            onChange: (value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            },
          },
          {
            placeholder: 'Year',
            options: [
              { value: 'all', label: 'All Years' },
              {
                value: new Date().getFullYear().toString(),
                label: new Date().getFullYear().toString(),
              },
              {
                value: (new Date().getFullYear() - 1).toString(),
                label: (new Date().getFullYear() - 1).toString(),
              },
              {
                value: (new Date().getFullYear() - 2).toString(),
                label: (new Date().getFullYear() - 2).toString(),
              },
            ],
            value: yearFilter,
            onChange: (value) => {
              setYearFilter(value);
              setCurrentPage(1);
            },
          },
        ]}
      />

      {/* Results Summary */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Showing {startIndex + 1} to{' '}
          {Math.min(endIndex, filteredRequests.length)} of{' '}
          {filteredRequests.length} requests
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground text-sm">Rows per page:</span>
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
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requests Table */}
      {filteredRequests.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:hidden">
            {paginatedRequests.map((request) => (
              <Card
                key={request.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() =>
                  router.push(
                    `/users/dashboard/workforce/leaves/requests/${request.id}?from=my-requests`
                  )
                }
              >
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="text-foreground font-mono text-sm font-medium">
                      {request.requestNumber}
                    </span>
                    <LeaveStatusBadge status={request.status} />
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    <span className="text-foreground text-sm">
                      {request.leaveTypeName}
                    </span>
                    <span className="text-foreground ml-auto text-sm font-semibold">
                      {request.totalDays}{' '}
                      {request.totalDays === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {format(new Date(request.startDate), 'MMM dd')} –{' '}
                    {format(new Date(request.endDate), 'MMM dd, yyyy')}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>

          {/* Desktop Table View */}
          <Card className="hidden lg:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request Number</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRequests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/users/dashboard/workforce/leaves/requests/${request.id}?from=my-requests`
                        )
                      }
                    >
                      <TableCell>
                        <div className="text-foreground font-medium">
                          {request.requestNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="text-muted-foreground h-4 w-4" />
                          <span className="text-foreground">
                            {request.leaveTypeName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-foreground">
                            {format(
                              new Date(request.startDate),
                              'MMM dd, yyyy'
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            to{' '}
                            {format(new Date(request.endDate), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-foreground font-semibold">
                          {request.totalDays}{' '}
                          {request.totalDays === 1 ? 'day' : 'days'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground max-w-[200px] truncate text-sm">
                          {request.reason}
                        </div>
                      </TableCell>
                      <TableCell>
                        <LeaveStatusBadge status={request.status} />
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground text-sm">
                          {request.submittedAt
                            ? format(
                                new Date(request.submittedAt),
                                'MMM dd, yyyy'
                              )
                            : request.createdAt
                              ? format(
                                  new Date(request.createdAt),
                                  'MMM dd, yyyy'
                                )
                              : '-'}
                        </div>
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
        </>
      ) : (
        <EmptyState
          icon={FileText}
          title="No leave requests found"
          description={
            hasActiveFilters
              ? 'Try adjusting your search or filters'
              : 'Get started by applying for your first leave'
          }
          action={
            hasActiveFilters
              ? undefined
              : {
                  label: 'Apply for Leave',
                  onClick: () =>
                    router.push('/users/dashboard/workforce/leaves/apply'),
                }
          }
        />
      )}
    </div>
  );
}
