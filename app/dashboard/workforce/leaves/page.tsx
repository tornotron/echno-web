'use client';

import { useState } from 'react';
import { AppLayout, Pagination } from '@/components/common';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  Filter,
  Plus,
  Check,
  X,
  Eye,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  mockLeaveRequests,
  getPendingLeaveRequests,
  getLeaveRequestsByStatus,
} from '@/components/shared/mock-data';
import {
  LeaveStatus,
  LeaveType,
  getLeaveStatusLabel,
  getLeaveStatusColor,
  getLeaveTypeLabel,
  getLeaveTypeColor,
} from '@/types/leave';

// Individual action handlers
const handleApprove = (leaveId: string) => {
  console.log('Approving leave:', leaveId);
  // TODO: Implement API call
};

const handleReject = (leaveId: string) => {
  console.log('Rejecting leave:', leaveId);
  // TODO: Implement API call
};

export default function LeaveRequestsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedLeaves, setSelectedLeaves] = useState<string[]>([]);

  // Filter leave requests
  const filteredLeaves = mockLeaveRequests.filter((leave) => {
    const matchesSearch =
      searchQuery === '' ||
      leave.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.employeeEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || leave.status === statusFilter;

    const matchesType = typeFilter === 'all' || leave.leaveType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate statistics
  const totalLeaves = mockLeaveRequests.length;
  const pendingLeaves = getPendingLeaveRequests().length;
  const approvedLeaves = getLeaveRequestsByStatus(LeaveStatus.approved).length;
  const rejectedLeaves = getLeaveRequestsByStatus(LeaveStatus.rejected).length;

  // Pagination
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeaves = filteredLeaves.slice(startIndex, endIndex);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeaves(currentLeaves.map((leave) => leave.id));
    } else {
      setSelectedLeaves([]);
    }
  };

  const handleSelectOne = (leaveId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeaves([...selectedLeaves, leaveId]);
    } else {
      setSelectedLeaves(selectedLeaves.filter((id) => id !== leaveId));
    }
  };

  // Bulk action handlers
  const handleBulkApprove = (ids: string[]) => {
    console.log('Bulk approving leaves:', ids);
    // TODO: Implement API call
    setSelectedLeaves([]);
  };

  const handleBulkReject = (ids: string[]) => {
    console.log('Bulk rejecting leaves:', ids);
    // TODO: Implement API call
    setSelectedLeaves([]);
  };

  // Individual action handlers

  const allSelected =
    currentLeaves.length > 0 && selectedLeaves.length === currentLeaves.length;
  const someSelected =
    selectedLeaves.length > 0 && selectedLeaves.length < currentLeaves.length;

  return (
    <AppLayout>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Leave Requests
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Manage and track employee leave requests
            </p>
          </div>
          <Link href="/dashboard/workforce/leaves/apply">
            <Button className="mt-4 md:mt-0">
              <Plus className="mr-2 h-4 w-4" />
              Apply for Leave
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {totalLeaves}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {pendingLeaves}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Approved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {approvedLeaves}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Rejected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {rejectedLeaves}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                <CardTitle>Search & Filters</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Search */}
              <div>
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-zinc-400" />
                  <Input
                    placeholder="Search by employee, email, or reason..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={LeaveStatus.pending}>Pending</SelectItem>
                  <SelectItem value={LeaveStatus.approved}>Approved</SelectItem>
                  <SelectItem value={LeaveStatus.rejected}>Rejected</SelectItem>
                  <SelectItem value={LeaveStatus.draft}>Draft</SelectItem>
                  <SelectItem value={LeaveStatus.cancelled}>
                    Cancelled
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Leave Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={LeaveType.casualLeave}>
                    Casual Leave
                  </SelectItem>
                  <SelectItem value={LeaveType.sickLeave}>
                    Sick Leave
                  </SelectItem>
                  <SelectItem value={LeaveType.earnedLeave}>
                    Earned Leave
                  </SelectItem>
                  <SelectItem value={LeaveType.maternityLeave}>
                    Maternity Leave
                  </SelectItem>
                  <SelectItem value={LeaveType.paternityLeave}>
                    Paternity Leave
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary and Bulk Actions */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Showing {startIndex + 1} to{' '}
              {Math.min(endIndex, filteredLeaves.length)} of{' '}
              {filteredLeaves.length} leave requests
            </p>
          </div>
          <div className="flex items-center gap-4">
            {selectedLeaves.length > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleBulkApprove(selectedLeaves)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve ({selectedLeaves.length})
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulkReject(selectedLeaves)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject ({selectedLeaves.length})
                </Button>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Rows per page:
              </span>
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
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-zinc-300"
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentLeaves.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-8 text-center text-zinc-500"
                    >
                      No leave requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  currentLeaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedLeaves.includes(leave.id)}
                          onChange={(e) =>
                            handleSelectOne(leave.id, e.target.checked)
                          }
                          className="rounded border-zinc-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {leave.employeeName}
                            </div>
                            <div className="text-sm text-zinc-500">
                              {leave.department}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getLeaveTypeColor(leave.leaveType)}>
                          {getLeaveTypeLabel(leave.leaveType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(leave.fromDate, 'dd MMM yyyy')}
                        </div>
                        <div className="text-sm text-zinc-500">
                          to {format(leave.toDate, 'dd MMM yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{leave.daysCount}</span>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm">{leave.reason}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getLeaveStatusColor(leave.status)}>
                          {getLeaveStatusLabel(leave.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-500">
                        {format(leave.appliedAt, 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`/dashboard/workforce/leaves/${leave.id}`}
                                >
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Details</p>
                              </TooltipContent>
                            </Tooltip>
                            {leave.status === LeaveStatus.pending && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleApprove(leave.id)}
                                      className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Approve Leave</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleReject(leave.id)}
                                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Reject Leave</p>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>

          {/* Pagination Controls */}
          {filteredLeaves.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
