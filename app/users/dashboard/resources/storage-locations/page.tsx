'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination, SearchAndFilter } from '@/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Storage Locations</h1>
          <p className="text-muted-foreground">
            Manage storage locations and warehouses
          </p>
        </div>
        <Button asChild>
          <Link href="/users/dashboard/resources/storage-locations/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Locations
            </CardTitle>
            <MapPin className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLocations}</div>
            <p className="text-muted-foreground text-xs">
              {activeLocations} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Capacity
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCapacity > 0
                ? totalCapacity >= 1000
                  ? `${(totalCapacity / 1000).toFixed(1)}K`
                  : totalCapacity.toLocaleString()
                : '—'}
            </div>
            <p className="text-muted-foreground text-xs">
              units across all locations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Location Types
            </CardTitle>
            <Building2 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locationTypes}</div>
            <p className="text-muted-foreground text-xs">different types</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLocations}</div>
            <p className="text-muted-foreground text-xs">
              {totalLocations - activeLocations} inactive
            </p>
          </CardContent>
        </Card>
      </div>

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
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading locations...</p>
          </CardContent>
        </Card>
      ) : filteredLocations.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedLocations.map((location) => (
                <Link
                  key={location.id}
                  href={`/users/dashboard/resources/storage-locations/${location.id}`}
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
          <CardContent className="py-12 text-center">
            <MapPin className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              No locations found
            </h3>
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              Try adjusting your filters or add a new location.
            </p>
            <Button asChild>
              <Link href="/users/dashboard/resources/storage-locations/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Link>
            </Button>
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
