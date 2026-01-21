'use client';

import { useState, useEffect } from 'react';
import { useAuthorization } from '@/hooks/use-authorization';
import { redirect, useRouter } from 'next/navigation';
import { Pagination, SearchAndFilter } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
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
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function AdminAccessRequestsPage() {
  const { isSystemAdmin, isLoading: authLoading } = useAuthorization();
  const router = useRouter();

  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Redirect if not system admin
  if (!authLoading && !isSystemAdmin) {
    redirect('/users/dashboard');
  }

  // Load access requests from mock data
  useEffect(() => {
    if (authLoading || !isSystemAdmin) return;

    // Simulate loading with mock data
    let isSubscribed = true;

    const timer = setTimeout(() => {
      if (!isSubscribed) return;

      // Filter mock data based on status and priority
      let filtered = [...mockAccessRequests];

      if (statusFilter !== 'all') {
        filtered = filtered.filter((req) => req.status === statusFilter);
      }

      if (priorityFilter !== 'all') {
        filtered = filtered.filter((req) => req.priority === priorityFilter);
      }

      // Sort by most recent first
      filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      setRequests(filtered);
      setLoading(false);
    }, 500); // Simulated delay

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [authLoading, isSystemAdmin, statusFilter, priorityFilter]);

  // Filter requests (client-side for quick filtering)
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      searchQuery === '' ||
      request.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requesterEmail
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getRequestSummary(request)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Calculate statistics from ALL mock data (not filtered view)
  const pendingCount = mockAccessRequests.filter(
    (r) =>
      r.status === AccessRequestStatus.PENDING ||
      r.status === AccessRequestStatus.UNDER_REVIEW
  ).length;
  const approvedCount = mockAccessRequests.filter(
    (r) => r.status === AccessRequestStatus.APPROVED
  ).length;
  const rejectedCount = mockAccessRequests.filter(
    (r) => r.status === AccessRequestStatus.REJECTED
  ).length;
  const urgentCount = mockAccessRequests.filter(
    (r) =>
      (r.priority === AccessRequestPriority.URGENT ||
        r.priority === AccessRequestPriority.HIGH) &&
      (r.status === AccessRequestStatus.PENDING ||
        r.status === AccessRequestStatus.UNDER_REVIEW)
  ).length;

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter !== 'pending' || priorityFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('pending');
    setPriorityFilter('all');
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Access Requests</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage access requests from users
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Pending Review</CardDescription>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingCount}
            </div>
            <p className="text-muted-foreground text-xs">Awaiting decision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Urgent</CardDescription>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentCount}</div>
            <p className="text-muted-foreground text-xs">
              High priority pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Approved</CardDescription>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {approvedCount}
            </div>
            <p className="text-muted-foreground text-xs">Total approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Rejected</CardDescription>
            <XCircle className="h-4 w-4 text-zinc-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-600">
              {rejectedCount}
            </div>
            <p className="text-muted-foreground text-xs">Total rejected</p>
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
        searchPlaceholder="Search by requester, email, or permission..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Status' },
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
              setLoading(true);
              setStatusFilter(value);
              setCurrentPage(1);
            },
          },
          {
            placeholder: 'Priority',
            options: [
              { value: 'all', label: 'All Priorities' },
              { value: AccessRequestPriority.URGENT, label: 'Urgent' },
              { value: AccessRequestPriority.HIGH, label: 'High' },
              { value: AccessRequestPriority.NORMAL, label: 'Normal' },
              { value: AccessRequestPriority.LOW, label: 'Low' },
            ],
            value: priorityFilter,
            onChange: (value) => {
              setLoading(true);
              setPriorityFilter(value);
              setCurrentPage(1);
            },
          },
        ]}
      />

      {/* Results Summary */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {filteredRequests.length === 0 ? 0 : startIndex + 1} to{' '}
          {Math.min(endIndex, filteredRequests.length)} of{' '}
          {filteredRequests.length} requests
        </p>
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
      {loading ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requester</TableHead>
                  <TableHead>Request</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : filteredRequests.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Requester</TableHead>
                    <TableHead>Request</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRequests.map((request) => (
                    <TableRow
                      key={request.id}
                      className="group hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() =>
                        router.push(`/admin/access-requests/${request.id}`)
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-zinc-400 to-zinc-600">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {request.requesterName}
                            </div>
                            <div className="text-sm text-zinc-500">
                              {request.requesterEmail}
                            </div>
                          </div>
                        </div>
                      </TableCell>
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
                          ? format(request.submittedAt, 'dd MMM yyyy HH:mm')
                          : request.createdAt
                            ? format(request.createdAt, 'dd MMM yyyy HH:mm')
                            : '-'}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              No access requests found
            </h3>
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              {hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'No pending requests to review'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
