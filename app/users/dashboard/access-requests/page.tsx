'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Pagination, SearchAndFilter } from '@/components/common';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  AccessRequest,
  AccessRequestStatus,
  AccessRequestPriority,
  getStatusLabel,
  getStatusColor,
  getPriorityLabel,
  getPriorityColor,
  getTypeLabel,
  getRequestSummary,
} from '@/types/access-request';
import { mockAccessRequests } from '@/components/shared/data/access-requests';

export default function AccessRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load access requests from mock data (simulating current user's requests)
  useEffect(() => {
    // Simulate loading with mock data
    const timer = setTimeout(() => {
      // For demo purposes, show requests from user IDs 3, 4, 5 (Rajesh, Priya, Amit)
      // In a real app, this would filter by the logged-in user's ID
      const userRequests = mockAccessRequests.filter((req) =>
        ['3', '4', '5'].includes(req.requesterId)
      );

      // Sort by most recent first
      userRequests.sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );

      setRequests(userRequests);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Filter requests
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      searchQuery === '' ||
      request.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getRequestSummary(request)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || request.status === statusFilter;

    const matchesPriority =
      priorityFilter === 'all' || request.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate statistics
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(
    (r) =>
      r.status === AccessRequestStatus.PENDING ||
      r.status === AccessRequestStatus.UNDER_REVIEW
  ).length;
  const approvedRequests = requests.filter(
    (r) => r.status === AccessRequestStatus.APPROVED
  ).length;
  const rejectedRequests = requests.filter(
    (r) => r.status === AccessRequestStatus.REJECTED
  ).length;

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            My Access Requests
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Request access to resources, modules, or roles
          </p>
        </div>
        <Link href="/users/dashboard/access-requests/new">
          <Button className="mt-4 md:mt-0">
            <Plus className="mr-2 h-4 w-4" />
            New Request
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
                {totalRequests}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {pendingRequests}
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
                {approvedRequests}
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
                {rejectedRequests}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by reason or permission..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Status' },
              { value: AccessRequestStatus.DRAFT, label: 'Draft' },
              { value: AccessRequestStatus.PENDING, label: 'Pending' },
              {
                value: AccessRequestStatus.UNDER_REVIEW,
                label: 'Under Review',
              },
              { value: AccessRequestStatus.APPROVED, label: 'Approved' },
              { value: AccessRequestStatus.REJECTED, label: 'Rejected' },
              { value: AccessRequestStatus.CANCELLED, label: 'Cancelled' },
            ],
            value: statusFilter,
            onChange: (value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            },
          },
          {
            placeholder: 'Priority',
            options: [
              { value: 'all', label: 'All Priorities' },
              { value: AccessRequestPriority.LOW, label: 'Low' },
              { value: AccessRequestPriority.NORMAL, label: 'Normal' },
              { value: AccessRequestPriority.HIGH, label: 'High' },
              { value: AccessRequestPriority.URGENT, label: 'Urgent' },
            ],
            value: priorityFilter,
            onChange: (value) => {
              setPriorityFilter(value);
              setCurrentPage(1);
            },
          },
        ]}
      />

      {/* Results Summary */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {filteredRequests.length === 0 ? 0 : startIndex + 1} to{' '}
            {Math.min(endIndex, filteredRequests.length)} of{' '}
            {filteredRequests.length} requests
          </p>
        </div>
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRequests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-zinc-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-zinc-400" />
                      <p>No access requests found</p>
                      <Link href="/users/dashboard/access-requests/new">
                        <Button variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Create your first request
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentRequests.map((request) => (
                  <TableRow
                    key={request.id}
                    className="group hover:bg-accent cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/users/dashboard/access-requests/${request.id}`
                      )
                    }
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {getRequestSummary(request)}
                        </div>
                        <div className="max-w-xs truncate text-sm text-zinc-500">
                          {request.reason}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {getTypeLabel(request.type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(request.priority)}>
                        {getPriorityLabel(request.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusLabel(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {request.submittedAt
                        ? format(request.submittedAt, 'dd MMM yyyy')
                        : request.createdAt
                          ? format(request.createdAt, 'dd MMM yyyy')
                          : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {request.updatedAt
                        ? format(request.updatedAt, 'dd MMM yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination Controls */}
        {filteredRequests.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>
    </div>
  );
}
