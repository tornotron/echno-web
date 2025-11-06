'use client';

import { useState } from 'react';
import { OrganizationCard } from '@/components/organization/organization-card';
import { AppLayout } from '@/components/common/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';
import { mockOrganizations } from '@/lib/mock-data';
import Link from 'next/link';

export default function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Filter organizations based on search and status
  const filteredOrganizations = mockOrganizations.filter((org) => {
    const matchesSearch =
      org.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.organizationAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.organizationEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && org.isActive) ||
      (statusFilter === 'inactive' && !org.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Organizations</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Manage and view all organizations
          </p>
        </div>
        <Link href="/dashboard/organizations/new">
          <Button className="sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Organization
          </Button>
        </Link>
      </div>        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Organizations</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {mockOrganizations.length}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Active</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-500 mt-1">
              {mockOrganizations.filter((org) => org.isActive).length}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Inactive</p>
            <p className="text-2xl font-bold text-zinc-600 dark:text-zinc-400 mt-1">
              {mockOrganizations.filter((org) => !org.isActive).length}
            </p>
          </div>
        </div>

        {/* Organizations Grid */}
        {filteredOrganizations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.map((organization) => (
              <OrganizationCard key={organization.id} organization={organization} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
              <Search className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
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
