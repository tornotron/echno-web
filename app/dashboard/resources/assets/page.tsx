'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout, Pagination, SearchAndFilter } from '@/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  AlertCircle,
  Cog,
  DollarSign,
  Eye,
  MapPin,
  Shield,
  Truck,
  Wrench,
} from 'lucide-react';
import {
  AssetStatus,
  AssetType,
  AssetCondition,
  assetStatusLabels,
  assetConditionLabels,
  getAssetStatusBadgeColor,
  getAssetConditionBadgeColor,
  calculateUtilization,
  isMaintenanceDue,
} from '@/types/resource';
import { mockAssets, mockLocations } from '@/components/shared/mock-data';

import { useMemo } from 'react';

const getUtilizationColor = (utilization: number) => {
  if (utilization >= 80) return 'bg-red-500';
  if (utilization >= 60) return 'bg-orange-500';
  if (utilization >= 40) return 'bg-yellow-500';
  return 'bg-green-500';
};

export default function AssetsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<AssetType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all');
  const [conditionFilter, setConditionFilter] = useState<
    AssetCondition | 'all'
  >('all');
  const [locationFilter, setLocationFilter] = useState<number | 'all'>('all');
  const [maintenanceDueFilter, setMaintenanceDueFilter] = useState(false);

  const [now] = useState(() => Date.now());

  // Filter assets
  const filteredAssets = useMemo(() => {
    return mockAssets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.assetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.model?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || asset.type === typeFilter;
      const matchesStatus =
        statusFilter === 'all' || asset.status === statusFilter;
      const matchesCondition =
        conditionFilter === 'all' || asset.condition === conditionFilter;
      const matchesLocation =
        locationFilter === 'all' || asset.locationId === locationFilter;
      const matchesMaintenanceDue =
        !maintenanceDueFilter || isMaintenanceDue(asset);

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesCondition &&
        matchesLocation &&
        matchesMaintenanceDue
      );
    });
  }, [
    searchQuery,
    typeFilter,
    statusFilter,
    conditionFilter,
    locationFilter,
    maintenanceDueFilter,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  // Calculate stats
  const totalAssets = mockAssets.length;
  const totalValue = mockAssets.reduce(
    (sum, asset) => sum + asset.currentValue,
    0
  );
  const inUseAssets = mockAssets.filter(
    (asset) => asset.status === 'in-use'
  ).length;
  const maintenanceDueAssets = mockAssets.filter((asset) =>
    isMaintenanceDue(asset)
  ).length;
  const underRepairAssets = mockAssets.filter(
    (asset) => asset.status === 'repair' || asset.status === 'maintenance'
  ).length;

  const hasActiveFilters = Boolean(
    searchQuery ||
      typeFilter !== 'all' ||
      statusFilter !== 'all' ||
      conditionFilter !== 'all' ||
      locationFilter !== 'all' ||
      maintenanceDueFilter
  );

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setConditionFilter('all');
    setLocationFilter('all');
    setMaintenanceDueFilter(false);
    setCurrentPage(1);
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
              Assets
            </h1>
            <p className="mt-1 text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
              Track equipment, vehicles, and machinery
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/resources/assets/new">
              <Cog className="mr-2 h-4 w-4" />
              Register Asset
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Total Assets
              </CardTitle>
              <Cog className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAssets}</div>
              <p className="text-muted-foreground text-xs">Registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Total Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{(totalValue / 10_000_000).toFixed(1)}Cr
              </div>
              <p className="text-muted-foreground text-xs">Current value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                In Use
              </CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {inUseAssets}
              </div>
              <p className="text-muted-foreground text-xs">Active assets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Maintenance Due
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {maintenanceDueAssets}
              </div>
              <p className="text-muted-foreground text-xs">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium sm:text-sm">
                Under Repair
              </CardTitle>
              <Wrench className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {underRepairAssets}
              </div>
              <p className="text-muted-foreground text-xs">In workshop</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <SearchAndFilter
          variant="card"
          searchValue={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search assets by name, ID, manufacturer..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          filters={[
            {
              placeholder: 'Asset Type',
              options: [
                { value: 'all', label: 'All Types' },
                { value: 'heavy-equipment', label: 'Heavy Equipment' },
                { value: 'light-equipment', label: 'Light Equipment' },
                { value: 'vehicle', label: 'Vehicle' },
                { value: 'tool', label: 'Tool' },
                { value: 'machinery', label: 'Machinery' },
                { value: 'generator', label: 'Generator' },
                { value: 'computer', label: 'Computer & IT' },
                { value: 'furniture', label: 'Furniture' },
                { value: 'other', label: 'Other' },
              ],
              value: typeFilter,
              onChange: (value) => {
                setTypeFilter(value as AssetType | 'all');
                setCurrentPage(1);
              },
            },
            {
              placeholder: 'Status',
              options: [
                { value: 'all', label: 'All Status' },
                { value: 'available', label: 'Available' },
                { value: 'in-use', label: 'In Use' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'repair', label: 'Under Repair' },
                { value: 'damaged', label: 'Damaged' },
                { value: 'retired', label: 'Retired' },
                { value: 'disposed', label: 'Disposed' },
              ],
              value: statusFilter,
              onChange: (value) => {
                setStatusFilter(value as AssetStatus | 'all');
                setCurrentPage(1);
              },
            },
            {
              placeholder: 'Condition',
              options: [
                { value: 'all', label: 'All Conditions' },
                { value: 'excellent', label: 'Excellent' },
                { value: 'good', label: 'Good' },
                { value: 'fair', label: 'Fair' },
                { value: 'poor', label: 'Poor' },
                { value: 'damaged', label: 'Damaged' },
              ],
              value: conditionFilter,
              onChange: (value) => {
                setConditionFilter(value as AssetCondition | 'all');
                setCurrentPage(1);
              },
            },
            {
              placeholder: 'Location',
              options: [
                { value: 'all', label: 'All Locations' },
                ...mockLocations.map((location) => ({
                  value: location.id.toString(),
                  label: location.name,
                })),
              ],
              value:
                locationFilter === 'all' ? 'all' : locationFilter.toString(),
              onChange: (value) => {
                setLocationFilter(
                  value === 'all' ? 'all' : Number.parseInt(value)
                );
                setCurrentPage(1);
              },
            },
          ]}
        />

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to{' '}
            {Math.min(endIndex, filteredAssets.length)} of{' '}
            {filteredAssets.length} assets
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Rows per page:
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Assets Grid */}
        {filteredAssets.length > 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {paginatedAssets.map((asset) => {
                  const utilization = calculateUtilization(
                    asset.usageHours,
                    asset.maxUsageHours
                  );
                  const maintenanceDue = isMaintenanceDue(asset);
                  const daysUntilMaintenance = asset.nextMaintenanceDate
                    ? Math.floor(
                        (asset.nextMaintenanceDate.getTime() - now) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null;

                  return (
                    <Link
                      key={asset.id}
                      href={`/dashboard/resources/assets/${asset.id}`}
                      className="block"
                    >
                      <div className="rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                          {/* Left: Asset Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-blue-600">
                                <Cog className="h-6 w-6 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                    {asset.name}
                                  </h3>
                                  <span className="text-xs text-zinc-500 dark:text-zinc-500">
                                    {asset.assetId}
                                  </span>
                                  {maintenanceDue && (
                                    <Badge
                                      variant="outline"
                                      className="border-orange-500 text-orange-600 dark:text-orange-400"
                                    >
                                      <AlertCircle className="mr-1 h-3 w-3" />
                                      Maintenance Due
                                    </Badge>
                                  )}
                                </div>
                                <p className="mt-1 line-clamp-1 text-sm text-zinc-600 dark:text-zinc-400">
                                  {asset.description}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-4">
                                  <div className="flex items-center text-xs text-zinc-500">
                                    <Truck className="mr-1 h-3 w-3" />
                                    {asset.manufacturer} {asset.model}
                                  </div>
                                  {asset.registrationNumber && (
                                    <div className="flex items-center text-xs text-zinc-500">
                                      <Shield className="mr-1 h-3 w-3" />
                                      {asset.registrationNumber}
                                    </div>
                                  )}
                                  <div className="flex items-center text-xs text-zinc-500">
                                    <MapPin className="mr-1 h-3 w-3" />
                                    {asset.location.name}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Middle: Status & Condition */}
                          <div className="flex gap-2">
                            <Badge
                              className={getAssetStatusBadgeColor(asset.status)}
                            >
                              {assetStatusLabels[asset.status]}
                            </Badge>
                            <Badge
                              className={getAssetConditionBadgeColor(
                                asset.condition
                              )}
                            >
                              {assetConditionLabels[asset.condition]}
                            </Badge>
                          </div>

                          {/* Right: Metrics */}
                          <div className="grid grid-cols-2 gap-4 lg:w-auto lg:grid-cols-4">
                            <div className="text-center">
                              <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-500">
                                Value
                              </div>
                              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                ₹{(asset.currentValue / 100_000).toFixed(1)}L
                              </div>
                            </div>
                            {asset.usageHours && asset.maxUsageHours && (
                              <div className="text-center">
                                <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-500">
                                  Utilization
                                </div>
                                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                  {utilization.toFixed(0)}%
                                </div>
                              </div>
                            )}
                            {asset.nextMaintenanceDate && (
                              <div className="text-center">
                                <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-500">
                                  Next Service
                                </div>
                                <div
                                  className={`text-sm font-semibold ${
                                    maintenanceDue
                                      ? 'text-orange-600 dark:text-orange-400'
                                      : 'text-zinc-900 dark:text-zinc-100'
                                  }`}
                                >
                                  {daysUntilMaintenance !== null &&
                                  daysUntilMaintenance >= 0
                                    ? `${daysUntilMaintenance}d`
                                    : 'Overdue'}
                                </div>
                              </div>
                            )}
                            {asset.assignedProject && (
                              <div className="text-center">
                                <div className="mb-1 text-xs text-zinc-500 dark:text-zinc-500">
                                  Project
                                </div>
                                <div className="truncate text-sm font-semibold text-blue-600 dark:text-blue-400">
                                  {asset.assignedProject}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* View Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Utilization Bar (if applicable) */}
                        {asset.usageHours && asset.maxUsageHours && (
                          <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                            <div className="mb-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
                              <span>
                                Usage Hours: {asset.usageHours} /{' '}
                                {asset.maxUsageHours}
                              </span>
                              <span>{utilization.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                              <div
                                className={`h-full transition-all ${getUtilizationColor(utilization)}`}
                                style={{
                                  width: `${Math.min(utilization, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Cog className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
              <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                No assets found
              </h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                {hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Get started by registering your first asset'}
              </p>
              {!hasActiveFilters && (
                <Button asChild>
                  <Link href="/dashboard/resources/assets/new">
                    <Cog className="mr-2 h-4 w-4" />
                    Register Asset
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
