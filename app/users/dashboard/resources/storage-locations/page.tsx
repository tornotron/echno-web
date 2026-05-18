'use client';

import { useState } from 'react';
import Link from 'next/link';
import { routes } from '@/nav';
import { Card } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { MapPin, Plus, Building2, BarChart3, CheckCircle2 } from 'lucide-react';
import { StorageLocationType } from '@/types/storage-locations';
import { useStorageLocations } from '@/hooks/storage-locations';
import { StorageLocationGrid } from '@/features/storage-locations/components';

interface LocationFilters {
  search: string;
  type: StorageLocationType | 'all';
  status: 'all' | 'active' | 'inactive';
}

export default function LocationsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [filters, setFilters] = useState<LocationFilters>({
    search: '',
    type: 'all',
    status: 'active',
  });

  const { data: locations = [], isLoading } = useStorageLocations();

  const handleFilterChange = (
    key: keyof LocationFilters,
    value: string | number | boolean
  ) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const filteredLocations = locations.filter((location) => {
    const matchesSearch =
      location.locationName
        .toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      location.address?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesType =
      filters.type === 'all' || location.locationType === filters.type;
    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'active' && location.active) ||
      (filters.status === 'inactive' && !location.active);
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filteredLocations.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const totalLocations = locations.length;
  const activeLocations = locations.filter((l) => l.active).length;
  const locationTypes = new Set(locations.map((l) => l.locationType)).size;
  const totalCapacity = locations.reduce(
    (sum, l) => sum + (l.capacity ?? 0),
    0
  );

  const hasActiveFilters = Boolean(
    filters.search || filters.type !== 'all' || filters.status !== 'all'
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Storage Locations"
        description="Manage storage locations and warehouses"
        actions={
          <Button asChild>
            <Link href={routes.resources.storageLocations.new}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Link>
          </Button>
        }
      />

      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Locations
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {totalLocations}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <MapPin className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              registered sites
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Capacity
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {totalCapacity > 0
                  ? totalCapacity >= 1000
                    ? `${(totalCapacity / 1000).toFixed(1)}K`
                    : totalCapacity.toLocaleString()
                  : '—'}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <BarChart3 className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              combined storage units
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Location Types
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                {locationTypes}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <Building2 className="size-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              distinct types in use
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Active</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {activeLocations}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              currently operational
            </p>
          </div>
        </div>
      </Card>

      <StorageLocationGrid
        paginated={paginated}
        filteredCount={filteredLocations.length}
        startIndex={startIndex}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(n) => {
          setItemsPerPage(n);
          setCurrentPage(1);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        hasActiveFilters={hasActiveFilters}
        searchValue={filters.search}
        onSearchChange={(v) => handleFilterChange('search', v)}
        typeFilter={filters.type}
        onTypeChange={(v) =>
          handleFilterChange('type', v as StorageLocationType | 'all')
        }
        statusFilter={filters.status}
        onStatusChange={(v) =>
          handleFilterChange('status', v as 'all' | 'active' | 'inactive')
        }
        isLoading={isLoading}
      />
    </div>
  );
}
