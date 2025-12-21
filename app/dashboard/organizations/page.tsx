'use client';

import { useState } from 'react';
import { OrganizationCard } from '@/features/organization/organization-card';
import { AppLayout } from '@/components/common/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';
import { mockOrganizations } from '@/components/shared/mock-data';
import Link from 'next/link';

export default function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');

  // Filter organizations based on search and status
  const filteredOrganizations = mockOrganizations.filter((org) => {
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

  return (
    <AppLayout>
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
          <Link href="/dashboard/organizations/new">
            <Button className="sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Organization
            </Button>
          </Link>
        </div>{' '}
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-zinc-400" />
            <Input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as 'all' | 'active' | 'inactive')
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Total Organizations
            </p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {mockOrganizations.length}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Active</p>
            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-500">
              {mockOrganizations.filter((org) => org.isActive).length}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Inactive</p>
            <p className="mt-1 text-2xl font-bold text-zinc-600 dark:text-zinc-400">
              {mockOrganizations.filter((org) => !org.isActive).length}
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
              <Search className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              No organizations found
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
