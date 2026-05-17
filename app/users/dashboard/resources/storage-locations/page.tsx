'use client';

import { useState } from 'react';
import Link from 'next/link';
import { routes } from '@/nav';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Pagination, SearchAndFilter, PageHeader } from '@/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  MapPin,
  Plus,
  Building2,
  Warehouse,
  Home,
  Box,
  BarChart3,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import {
  StorageLocationType,
  STORAGE_LOCATION_TYPE_LABELS,
} from '@/types/storage-locations';
import { useStorageLocations } from '@/hooks/storage-locations';

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
  const paginatedLocations = filteredLocations.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleFilterChange = (
    key: keyof LocationFilters,
    value: string | number | boolean
  ) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const totalLocations = locations.length;
  const activeLocations = locations.filter((l) => l.active).length;
  const locationTypes = new Set(locations.map((l) => l.locationType)).size;
  const totalCapacity = locations.reduce(
    (sum, l) => sum + (l.capacity ?? 0),
    0
  );

  const getLocationIcon = (type: StorageLocationType) => {
    switch (type) {
      case StorageLocationType.GODOWN: {
        return <Warehouse className="h-5 w-5" />;
      }
      case StorageLocationType.HEAD_OFFICE: {
        return <Building2 className="h-5 w-5" />;
      }
      case StorageLocationType.PROJECT_SITE: {
        return <Home className="h-5 w-5" />;
      }
      case StorageLocationType.WAREHOUSE: {
        return <Box className="h-5 w-5" />;
      }
      default: {
        return <MapPin className="h-5 w-5" />;
      }
    }
  };

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

      {/* Stats Cards */}
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

      {/* Filters */}
      <SearchAndFilter
        variant="card"
        searchValue={filters.search}
        onSearchChange={(value) => handleFilterChange('search', value)}
        searchPlaceholder="Search locations..."
        hasActiveFilters={Boolean(
          filters.search || filters.type !== 'all' || filters.status !== 'all'
        )}
        onClearFilters={() => {
          setFilters({ search: '', type: 'all', status: 'all' });
          setCurrentPage(1);
        }}
        filters={[
          {
            placeholder: 'Type',
            options: [
              { value: 'all', label: 'All Types' },
              ...Object.entries(STORAGE_LOCATION_TYPE_LABELS).map(
                ([value, label]) => ({ value, label })
              ),
            ],
            value: filters.type,
            onChange: (value) =>
              handleFilterChange('type', value as StorageLocationType | 'all'),
          },
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ],
            value: filters.status,
            onChange: (value) =>
              handleFilterChange(
                'status',
                value as 'all' | 'active' | 'inactive'
              ),
          },
        ]}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {filteredLocations.length > 0 ? startIndex + 1 : 0} to{' '}
          {Math.min(startIndex + itemsPerPage, filteredLocations.length)} of{' '}
          {filteredLocations.length} locations
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Rows per page:
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number.parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="9">9</SelectItem>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="18">18</SelectItem>
              <SelectItem value="24">24</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Locations Grid */}
      {isLoading ? (
        <Card>
          <CardContent className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </CardContent>
        </Card>
      ) : filteredLocations.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedLocations.map((location) => (
                <Link
                  key={location.id}
                  href={
                    routes.resources.storageLocations.detail(location.id).href
                  }
                  className="block"
                >
                  <Card className="transition-shadow hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`rounded-lg p-2 ${getTypeColor(location.locationType)}`}
                          >
                            {getLocationIcon(location.locationType)}
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {location.locationName}
                            </CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {
                                STORAGE_LOCATION_TYPE_LABELS[
                                  location.locationType
                                ]
                              }
                            </Badge>
                          </div>
                        </div>
                        <Badge
                          variant={location.active ? 'default' : 'secondary'}
                        >
                          {location.active ? (
                            <>
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1 h-3 w-3" /> Inactive
                            </>
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {location.address && (
                        <div className="text-muted-foreground text-sm">
                          <MapPin className="mr-1 inline h-3 w-3" />
                          {location.address}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-muted-foreground text-xs">
                            Capacity
                          </div>
                          <div className="text-lg font-bold">
                            {location.capacity?.toLocaleString() ?? '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">
                            Items Stored
                          </div>
                          <div className="text-lg font-bold text-blue-600">
                            {location.storageItemsCount ?? 0}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Empty variant="inline">
              <EmptyMedia variant="icon">
                <MapPin className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No locations found</EmptyTitle>
                <EmptyDescription>
                  Try adjusting your filters or add a new location.
                </EmptyDescription>
              </EmptyHeader>
              <Button asChild>
                <Link href={routes.resources.storageLocations.new}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Location
                </Link>
              </Button>
            </Empty>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const getTypeColor = (type: StorageLocationType) => {
  switch (type) {
    case StorageLocationType.GODOWN: {
      return 'bg-blue-100 text-blue-600';
    }
    case StorageLocationType.HEAD_OFFICE: {
      return 'bg-purple-100 text-purple-600';
    }
    case StorageLocationType.PROJECT_SITE: {
      return 'bg-green-100 text-green-600';
    }
    case StorageLocationType.WAREHOUSE: {
      return 'bg-yellow-100 text-yellow-600';
    }
    case StorageLocationType.PROCESSING_PLANT: {
      return 'bg-orange-100 text-orange-600';
    }
    default: {
      return 'bg-gray-100 text-gray-600';
    }
  }
};
