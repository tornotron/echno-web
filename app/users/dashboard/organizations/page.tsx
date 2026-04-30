'use client';

import { useState } from 'react';
import { OrganizationCard } from '@/features/organization';
import { SearchAndFilter } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Plus, Search, Building2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useOrganizations } from '@/hooks/organization/use-organizations';

export default function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  const { data: organizations, isLoading, error } = useOrganizations();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error loading organizations
      </div>
    );
  }

  // Filter organizations based on search and status
  const filteredOrganizations = (organizations || []).filter((org) => {
    const matchesSearch =
      org.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.organizationAddress
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      org.organizationEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && org.isActive) ||
      (statusFilter === 'inactive' && !org.isActive);

    return matchesSearch && matchesStatus;
  });

  const hasActiveFilters = !!searchQuery || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Organizations
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Manage and view all organizations
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/users/dashboard/organizations/join">
            <Button variant="outline" className="sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              Join Organization
            </Button>
          </Link>
          <Link href="/users/dashboard/organizations/new">
            <Button className="sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search organizations..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ],
            value: statusFilter,
            onChange: (value) =>
              setStatusFilter(value as 'all' | 'active' | 'inactive'),
          },
        ]}
      />
      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Total Organizations
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {(organizations || []).length}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Active</p>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-500">
            {(organizations || []).filter((org) => org.isActive).length}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Inactive</p>
          <p className="mt-1 text-2xl font-bold text-zinc-600 dark:text-zinc-400">
            {(organizations || []).filter((org) => !org.isActive).length}
          </p>
        </div>
      </div>
      {/* Organizations Grid */}
      {filteredOrganizations.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrganizations.map((organization) => (
            <OrganizationCard
              key={organization.id}
              organization={organization}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            {searchQuery || statusFilter !== 'all' ? (
              <Search className="h-8 w-8 text-zinc-400" />
            ) : (
              <Building2 className="h-8 w-8 text-zinc-400" />
            )}
          </div>
          <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            No organizations found
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || statusFilter !== 'all'
              ? "Try adjusting your filters to find what you're looking for."
              : 'Get started by creating a new organization or joining an existing one.'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <div className="flex justify-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/users/dashboard/organizations/join">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join Organization
                </Link>
              </Button>
              <Button asChild>
                <Link href="/users/dashboard/organizations/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Organization
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
