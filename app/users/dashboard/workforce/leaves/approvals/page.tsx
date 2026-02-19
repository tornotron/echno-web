'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { StatCard } from '@/components/leave/stat-card';
import { TableSkeleton } from '@/components/leave/skeletons';
import { EmptyState } from '@/components/leave/empty-state';
import { useApproverRequests } from '@/hooks/leave/use-leave';
import {
  LeaveStatus,
  getLeaveStatusLabel,
  getLeaveStatusColor,
} from '@/types/leave';
import { useCurrentUserEmployee } from '@/hooks/employee';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { Department, getDepartmentLabel } from '@/types/employee/departments';

export default function ApprovalsPage() {
  const router = useRouter();
  const { data: employee, isLoading: employeeLoading } =
    useCurrentUserEmployee();
  const employeeId = employee?.id || 0;

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: allRequests } = useApproverRequests(employeeId);

  // Get unique departments
  const uniqueDepartments = useMemo(() => {
    return [
      ...new Set(allRequests?.map((r) => r.department).filter(Boolean)),
    ].toSorted() as string[];
  }, [allRequests]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return (allRequests || []).filter((request) => {
      const matchesSearch =
        searchQuery === '' ||
        request.employeeName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        request.requestNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        request.leaveTypeName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesDepartment =
        departmentFilter === 'all' || request.department === departmentFilter;

      const matchesStatus =
        statusFilter === 'all' || request.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [allRequests, searchQuery, departmentFilter, statusFilter]);

  // Sort by urgency (start date)
  const sortedRequests = useMemo(() => {
    return [...filteredRequests].toSorted((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [filteredRequests]);

  // Pagination
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = sortedRequests.slice(startIndex, endIndex);

  // Statistics
  const totalRequests = allRequests?.length || 0;
  const pendingCount =
    allRequests?.filter((r) => r.status === LeaveStatus.PENDING_APPROVAL)
      .length || 0;
  const approvedCount =
    allRequests?.filter((r) => r.status === LeaveStatus.APPROVED).length || 0;
  const rejectedCount =
    allRequests?.filter((r) => r.status === LeaveStatus.REJECTED).length || 0;

  const hasActiveFilters = Boolean(
    searchQuery || departmentFilter !== 'all' || statusFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  if (employeeLoading) {
    return <TableSkeleton />;
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
      <div className="mb-8">
        <h1 className="text-foreground mb-2 text-3xl font-bold">
          All Approvals
        </h1>
        <p className="text-muted-foreground">
          All leave requests assigned to you for review
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Total Requests"
          value={totalRequests}
          color="blue"
        />
        <StatCard
          icon={AlertCircle}
          label="Pending"
          value={pendingCount}
          color="yellow"
        />
        <StatCard
          icon={CheckCircle2}
          label="Approved"
          value={approvedCount}
          color="green"
        />
        <StatCard
          icon={XCircle}
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
        searchPlaceholder="Search by employee name, request number, or leave type..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Statuses' },
              ...Object.values(LeaveStatus).map((status) => ({
                value: status,
                label: getLeaveStatusLabel(status),
              })),
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
        ]}
      />

      {/* Results Summary */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Showing {startIndex + 1} to{' '}
          {Math.min(endIndex, sortedRequests.length)} of {sortedRequests.length}{' '}
          requests
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

      {/* Approvals Table */}
      {sortedRequests.length > 0 ? (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:hidden">
            {paginatedRequests.map((request) => (
              <Card
                key={request.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() =>
                  router.push(
                    `/users/dashboard/workforce/leaves/requests/${request.id}?from=approvals`
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
                          {getDepartmentLabel(request.department as Department)}
                        </p>
                      )}
                    </div>
                    <Badge className={getLeaveStatusColor(request.status)}>
                      {getLeaveStatusLabel(request.status)}
                    </Badge>
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
                  <div className="text-muted-foreground mb-3 text-sm">
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
                    <TableHead>Request #</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRequests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/users/dashboard/workforce/leaves/requests/${request.id}?from=approvals`
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
                              {getDepartmentLabel(
                                request.department as Department
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-foreground font-mono text-sm">
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
                        <Badge className={getLeaveStatusColor(request.status)}>
                          {getLeaveStatusLabel(request.status)}
                        </Badge>
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
          icon={Users}
          title="No leave requests"
          description={
            hasActiveFilters
              ? 'Try adjusting your search or filters'
              : 'No leave requests have been assigned to you'
          }
        />
      )}
    </div>
  );
}
