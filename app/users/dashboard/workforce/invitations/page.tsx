'use client';

import { useState } from 'react';
import { Pagination, SearchAndFilter } from '@/components/common';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  LucideIcon,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { getInvitationStatus } from '@/types/invitation/invitation';
import { useInvitationsByOrganization } from '@/hooks/invitation';
import { useUser } from '@/hooks/user/use-user';

const getStatusBadge = (status: string) => {
  const config: Record<
    string,
    { label: string; className: string; icon: LucideIcon }
  > = {
    pending: {
      label: 'Pending',
      className:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
      icon: Clock,
    },
    accepted: {
      label: 'Accepted',
      className:
        'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300',
      icon: CheckCircle,
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
      icon: XCircle,
    },
    expired: {
      label: 'Expired',
      className:
        'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
      icon: AlertCircle,
    },
  };

  const { label, className, icon: Icon } = config[status] || config.pending;
  return (
    <Badge className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
    </Badge>
  );
};

export default function InvitationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedInvitations, setSelectedInvitations] = useState<string[]>([]);

  const { data: user } = useUser();
  const {
    data: invitations,
    isLoading,
    error,
  } = useInvitationsByOrganization(user?.defaultOrganizationId);

  const invitationsList = invitations || [];

  // Filter invitations
  const filteredInvitations = invitationsList.filter((inv) => {
    const matchesSearch =
      searchQuery === '' ||
      inv.employeeDetails.employeeName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      inv.inviteCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.employeeDetails.employeeId
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      inv.employeeDetails.email
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || getInvitationStatus(inv) === statusFilter;
    const matchesDepartment =
      departmentFilter === 'all' ||
      inv.employeeDetails.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Calculate statistics
  const totalInvitations = invitationsList.length;
  const pendingInvitations = invitationsList.filter(
    (i) => getInvitationStatus(i) === 'pending'
  ).length;
  const acceptedInvitations = invitationsList.filter(
    (i) => getInvitationStatus(i) === 'accepted'
  ).length;
  const expiredInvitations = invitationsList.filter(
    (i) => getInvitationStatus(i) === 'expired'
  ).length;

  // Pagination
  const totalPages = Math.ceil(filteredInvitations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvitations = filteredInvitations.slice(startIndex, endIndex);

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter !== 'all' || departmentFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setCurrentPage(1);
  };

  // Checkbox selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvitations(currentInvitations.map((inv) => inv.inviteCode));
    } else {
      setSelectedInvitations([]);
    }
  };

  const handleSelectOne = (inviteCode: string, checked: boolean) => {
    if (checked) {
      setSelectedInvitations((prev) => [...prev, inviteCode]);
    } else {
      setSelectedInvitations((prev) =>
        prev.filter((code) => code !== inviteCode)
      );
    }
  };

  const isAllSelected =
    currentInvitations.length > 0 &&
    currentInvitations.every((inv) =>
      selectedInvitations.includes(inv.inviteCode)
    );
  const isSomeSelected = selectedInvitations.length > 0 && !isAllSelected;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 text-xl font-semibold">
          Error Loading Invitations
        </h2>
        <p className="text-zinc-500">
          Failed to load invitations. Please try again later.
        </p>
      </div>
    );
  }

  if (!user?.defaultOrganizationId) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-12 w-12 text-yellow-500" />
        <h2 className="mb-2 text-xl font-semibold">No Organization Selected</h2>
        <p className="text-zinc-500">
          Please select an organization to view invitations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Employee Invitations
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage and track employee invitation status
          </p>
        </div>
        <Link href="/users/dashboard/workforce/invitations/new">
          <Button className="mt-4 md:mt-0">
            <Plus className="mr-2 h-4 w-4" />
            Create Invitation
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid grid-cols-2 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Invitations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {totalInvitations}
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
                {pendingInvitations}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Accepted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {acceptedInvitations}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Expired</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <AlertCircle className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {expiredInvitations}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by name, code, email..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'expired', label: 'Expired' },
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
              { value: 'Engineering', label: 'Engineering' },
              { value: 'Quality', label: 'Quality' },
              { value: 'Safety', label: 'Safety' },
              { value: 'Human Resources', label: 'Human Resources' },
              { value: 'Operations', label: 'Operations' },
            ],
            value: departmentFilter,
            onChange: (value) => {
              setDepartmentFilter(value);
              setCurrentPage(1);
            },
          },
        ]}
      />

      {/* Table Header Info - Outside Card */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {startIndex + 1} to{' '}
          {Math.min(endIndex, filteredInvitations.length)} of{' '}
          {filteredInvitations.length} invitation records
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Rows per page:
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(val) => setItemsPerPage(Number(val))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="space-y-3 md:hidden">
        {currentInvitations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-zinc-500">
              No invitation records found
            </CardContent>
          </Card>
        ) : (
          currentInvitations.map((invitation) => (
            <Card
              key={invitation.inviteCode}
              className="cursor-pointer"
              onClick={() =>
                (globalThis.location.href = `/users/dashboard/workforce/invitations/${invitation.inviteCode}`)
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-purple-600">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {invitation.employeeDetails.employeeName || 'N/A'}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {invitation.inviteCode}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(getInvitationStatus(invitation))}
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Designation
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {invitation.employeeDetails.designation}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Expires
                    </span>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {invitation.expiryDate
                        ? format(invitation.expiryDate, 'MMM dd, yyyy')
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {filteredInvitations.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Invitations Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-200 hover:bg-transparent dark:border-zinc-800">
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                    className={
                      isSomeSelected ? 'data-[state=checked]:bg-primary/50' : ''
                    }
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentInvitations.length > 0 ? (
                currentInvitations.map((invitation) => (
                  <TableRow
                    key={invitation.inviteCode}
                    className="hover:bg-muted/50 cursor-pointer border-b border-zinc-200 dark:border-zinc-800"
                    onClick={() =>
                      (globalThis.location.href = `/users/dashboard/workforce/invitations/${invitation.inviteCode}`)
                    }
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedInvitations.includes(
                          invitation.inviteCode
                        )}
                        onCheckedChange={(checked) =>
                          handleSelectOne(
                            invitation.inviteCode,
                            checked as boolean
                          )
                        }
                        aria-label={`Select ${invitation.employeeDetails.employeeName || 'invitation'}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-purple-500 to-purple-600">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {invitation.employeeDetails.employeeName || 'N/A'}
                          </div>
                          <div className="text-sm text-zinc-500 dark:text-zinc-400">
                            {invitation.employeeDetails.employeeId ||
                              'Not Assigned'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-zinc-900 dark:text-zinc-100">
                        {invitation.employeeDetails.designation}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(getInvitationStatus(invitation))}
                    </TableCell>
                    <TableCell>
                      {invitation.expiryDate ? (
                        <>
                          <div className="text-sm text-zinc-900 dark:text-zinc-100">
                            {format(invitation.expiryDate, 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {format(invitation.expiryDate, 'h:mm a')}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-zinc-500">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {invitation.expiryDate ? (
                        <>
                          <div className="text-sm text-zinc-900 dark:text-zinc-100">
                            {format(invitation.expiryDate, 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {format(invitation.expiryDate, 'h:mm a')}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-zinc-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <AlertCircle className="mx-auto mb-2 h-8 w-8 text-zinc-400" />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      No invitations found
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination - Inside Card at bottom */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
