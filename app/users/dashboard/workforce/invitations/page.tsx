'use client';

import { useState } from 'react';
import { SearchAndFilter } from '@/components/common';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { getInvitationStatus } from '@/types/invitation/invitation';
import { useInvitationsByOrganization } from '@/hooks/invitation';
import { useUser } from '@/hooks/user/use-user';
import { InvitationTable } from '@/features/invitation';

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

  const handleSelectAll = (checked: boolean) => {
    setSelectedInvitations(
      checked ? currentInvitations.map((inv) => inv.inviteCode) : []
    );
  };

  const handleSelectOne = (inviteCode: string, checked: boolean) => {
    setSelectedInvitations((prev) =>
      checked ? [...prev, inviteCode] : prev.filter((c) => c !== inviteCode)
    );
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
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
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

      {/* Table */}
      <InvitationTable
        invitations={currentInvitations}
        totalCount={filteredInvitations.length}
        startIndex={startIndex}
        endIndex={endIndex}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(n) => {
          setItemsPerPage(n);
          setCurrentPage(1);
        }}
        selectedInvitations={selectedInvitations}
        isAllSelected={isAllSelected}
        isSomeSelected={isSomeSelected}
        onSelectAll={handleSelectAll}
        onSelectOne={handleSelectOne}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
