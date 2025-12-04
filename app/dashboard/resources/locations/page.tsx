'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AppLayout, Pagination } from '@/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  Search,
  Plus,
  Building2,
  Warehouse,
  Home,
  Box,
  Eye,
  Edit,
  BarChart3,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { LocationType, locationTypeLabels } from '@/types/resource/location';
import {
  mockLocations,
  mockLocationInventory,
} from '@/components/shared/mock-data';

interface LocationFilters {
  search: string;
  type: LocationType | 'all';
  status: 'all' | 'active' | 'inactive';
}

export default function LocationsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3 columns x 3 rows

  const [filters, setFilters] = useState<LocationFilters>({
    search: '',
    type: 'all',
    status: 'active',
  });

  // Filter locations
  const filteredLocations = mockLocations.filter((location) => {
    const matchesSearch =
      location.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      location.address?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesType =
      filters.type === 'all' || location.type === filters.type;
    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'active' && location.isActive) ||
      (filters.status === 'inactive' && !location.isActive);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLocations = filteredLocations.slice(startIndex, endIndex);

  // Handle filter changes - reset to page 1
  const handleFilterChange = (
    key: keyof LocationFilters,
    value: string | number | boolean
  ) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  // Statistics
  const totalLocations = mockLocations.length;
  const activeLocations = mockLocations.filter((l) => l.isActive).length;
  const totalCapacity = mockLocations.reduce(
    (sum, l) => sum + (l.capacity || 0),
    0
  );
  const locationTypes = new Set(mockLocations.map((l) => l.type)).size;

  const getLocationIcon = (type: LocationType) => {
    switch (type) {
      case 'godown': {
        return <Warehouse className="h-5 w-5" />;
      }
      case 'head-office': {
        return <Building2 className="h-5 w-5" />;
      }
      case 'project-site': {
        return <Home className="h-5 w-5" />;
      }
      case 'warehouse': {
        return <Box className="h-5 w-5" />;
      }
      default: {
        return <MapPin className="h-5 w-5" />;
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Locations</h1>
            <p className="text-muted-foreground">
              Manage storage locations and warehouses
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/resources/locations/new">
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
                {(totalCapacity / 1000).toFixed(1)}K
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
              <CardTitle className="text-sm font-medium">
                Avg. Capacity
              </CardTitle>
              <Box className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(totalCapacity / totalLocations)}
              </div>
              <p className="text-muted-foreground text-xs">
                units per location
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filter Locations
            </CardTitle>
            <CardDescription>
              Search and filter locations by type and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Search */}
              <div className="relative">
                <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                <Input
                  placeholder="Search locations..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Type Filter */}
              <Select
                value={filters.type}
                onValueChange={(value) =>
                  handleFilterChange('type', value as LocationType | 'all')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(locationTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  handleFilterChange(
                    'status',
                    value as 'all' | 'active' | 'inactive'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Locations Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>
            <CardDescription>
              Showing {paginatedLocations.length} of {filteredLocations.length}{' '}
              locations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedLocations.map((location) => {
                const inventoryCount = mockLocationInventory[location.id] || 0;
                return (
                  <Card
                    key={location.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div
                            className={`rounded-lg p-2 ${getTypeColor(location.type)}`}
                          >
                            {getLocationIcon(location.type)}
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {location.name}
                            </CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {locationTypeLabels[location.type]}
                            </Badge>
                          </div>
                        </div>
                        <Badge
                          variant={location.isActive ? 'default' : 'secondary'}
                        >
                          {location.isActive ? (
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
                            {location.capacity?.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">
                            Items Stored
                          </div>
                          <div className="text-lg font-bold text-blue-600">
                            {inventoryCount}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <Link
                            href={`/dashboard/resources/locations/${location.id}`}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          asChild
                        >
                          <Link
                            href={`/dashboard/resources/locations/${location.id}/edit`}
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {paginatedLocations.length === 0 && (
              <div className="py-12 text-center">
                <MapPin className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">
                  No locations found
                </h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or add a new location
                </p>
                <Button asChild>
                  <Link href="/dashboard/resources/locations/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Location
                  </Link>
                </Button>
              </div>
            )}

            {/* Pagination */}
            {filteredLocations.length > 0 && totalPages > 1 && (
              <div className="mt-6 border-t pt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

const getTypeColor = (type: LocationType) => {
  switch (type) {
    case 'godown': {
      return 'bg-blue-100 text-blue-600';
    }
    case 'head-office': {
      return 'bg-purple-100 text-purple-600';
    }
    case 'project-site': {
      return 'bg-green-100 text-green-600';
    }
    case 'warehouse': {
      return 'bg-yellow-100 text-yellow-600';
    }
    default: {
      return 'bg-gray-100 text-gray-600';
    }
  }
};
