'use client';

import { useState } from 'react';
import { SearchAndFilter } from '@/components/common';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getInvitationStatus } from '@/types/invitation/invitation';
import { useInvitationsByOrganization } from '@/hooks/invitation';
import { useUser } from '@/hooks/user/use-user';
import { InvitationTable } from '@/features/invitation';
import { InvitationHeader } from '@/features/invitation/components/invitation-header';
import { InvitationStats } from '@/features/invitation/components/invitation-stats';

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
  const isSomeSelected =
    currentInvitations.some((inv) =>
      selectedInvitations.includes(inv.inviteCode)
    ) && !isAllSelected;

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
      <InvitationHeader />

      {/* Statistics Cards */}
      <InvitationStats
        total={totalInvitations}
        pending={pendingInvitations}
        accepted={acceptedInvitations}
        expired={expiredInvitations}
      />

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
