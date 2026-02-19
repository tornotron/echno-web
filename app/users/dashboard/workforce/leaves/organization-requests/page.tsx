'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
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
import { LeaveStatusBadge } from '@/components/leave/leave-status-badge';
import { StatCard } from '@/components/leave/stat-card';
import { TableSkeleton } from '@/components/leave/skeletons';
import { EmptyState } from '@/components/leave/empty-state';
import { useOrganizationRequests } from '@/hooks/leave/use-leave';
import { LeaveStatus } from '@/types/leave';
import { FileText, AlertCircle, Calendar, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function OrganizationRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Read initial filter values from URL params
  const initialStatus = searchParams.get('status') || 'all';
  const initialDepartment = searchParams.get('department') || 'all';
  const initialYear =
    searchParams.get('year') || new Date().getFullYear().toString();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [departmentFilter, setDepartmentFilter] =
    useState<string>(initialDepartment);
  const [yearFilter, setYearFilter] = useState<string>(initialYear);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sync filters when URL params change (React-recommended render-time adjustment)
  const [prevSearchParams, setPrevSearchParams] = useState(searchParams);
  if (searchParams !== prevSearchParams) {
    setPrevSearchParams(searchParams);
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const year = searchParams.get('year');

    if (status && status !== statusFilter) setStatusFilter(status);
    if (department && department !== departmentFilter)
      setDepartmentFilter(department);
    if (year && year !== yearFilter) setYearFilter(year);
  }

  const { data: requests, isLoading, error } = useOrganizationRequests();

  // Get unique departments
  const uniqueDepartments = useMemo(() => {
    return [
      ...new Set(requests?.map((r) => r.department).filter(Boolean)),
    ].toSorted() as string[];
  }, [requests]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return (requests || []).filter((request) => {
      const matchesSearch =
        searchQuery === '' ||
        request.employeeName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        request.leaveTypeName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        request.requestNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        request.reason.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || request.status === statusFilter;

      const matchesDepartment =
        departmentFilter === 'all' || request.department === departmentFilter;

      const matchesYear =
        yearFilter === 'all' ||
        new Date(request.startDate).getFullYear().toString() === yearFilter;

      return matchesSearch && matchesStatus && matchesDepartment && matchesYear;
    });
  }, [requests, searchQuery, statusFilter, departmentFilter, yearFilter]);

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
  const uniqueEmployees = new Set(requests?.map((r) => r.employeeId)).size || 0;

  const hasActiveFilters = Boolean(
    searchQuery ||
      statusFilter !== 'all' ||
      departmentFilter !== 'all' ||
      yearFilter !== new Date().getFullYear().toString()
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setYearFilter(new Date().getFullYear().toString());
    setCurrentPage(1);
  };

  if (isLoading) {
    return <TableSkeleton statCount={6} />;
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold">Error Loading Requests</h2>
        <p className="text-muted-foreground">
          Failed to load organization requests. Please try again later.
        </p>
      </div>
    );
  }

  // Get page title based on status filter
  const getPageTitle = () => {
    if (statusFilter === LeaveStatus.PENDING_APPROVAL) {
      return 'Pending Approvals';
    }
    return 'Organization Leave Requests';
  };

  const getPageDescription = () => {
    if (statusFilter === LeaveStatus.PENDING_APPROVAL) {
      return 'Review all pending leave requests across the organization';
    }
    return 'View and manage all leave requests across the organization';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-foreground mb-2 text-3xl font-bold">
          {getPageTitle()}
        </h1>
        <p className="text-muted-foreground">{getPageDescription()}</p>
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
          icon={Users}
          label="Employees"
          value={uniqueEmployees}
          color="purple"
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
        searchPlaceholder="Search by employee, leave type, request number, or reason..."
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
            placeholder: 'Department',
            options: [
              { value: 'all', label: 'All Departments' },
              ...uniqueDepartments.map((dept) => ({
                value: dept,
                label: dept,
              })),
            ],
            value: departmentFilter,
            onChange: (value) => {
              setDepartmentFilter(value);
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
              <SelectItem value="100">100</SelectItem>
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
                    `/users/dashboard/workforce/leaves/requests/${request.id}?from=org-requests`
                  )
                }
              >
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-foreground font-medium">
                        {request.employeeName}
                      </p>
                      {request.department && (
                        <p className="text-muted-foreground text-xs">
                          {request.department}
                        </p>
                      )}
                    </div>
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
                    <TableHead>Employee</TableHead>
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
                          `/users/dashboard/workforce/leaves/requests/${request.id}?from=org-requests`
                        )
                      }
                    >
                      <TableCell>
                        <div>
                          <div className="text-foreground font-medium">
                            {request.employeeName}
                          </div>
                          {request.department && (
                            <div className="text-muted-foreground text-xs">
                              {request.department}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-foreground font-mono text-sm font-medium">
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
              : 'No leave requests have been created yet'
          }
        />
      )}
    </div>
  );
}
