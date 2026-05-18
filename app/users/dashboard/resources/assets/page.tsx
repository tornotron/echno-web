'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { routes } from '@/nav';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Pagination, PageHeader } from '@/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Activity,
  AlertCircle,
  Cog,
  DollarSign,
  Loader2,
  Wrench,
  Search,
} from 'lucide-react';
import {
  Empty,
  EmptyErrorMedia,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import {
  AssetStatus,
  AssetType,
  AssetCondition,
  isMaintenanceDue,
} from '@/types/resource';
import { useAssets } from '@/hooks/assets';
import { useStorageLocations } from '@/hooks/storage-locations';
import { AssetListItem } from '@/features/resources/components';

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

  const { data: assets = [], isLoading, isError } = useAssets();
  const { data: locations = [] } = useStorageLocations();

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
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
    assets,
    searchQuery,
    typeFilter,
    statusFilter,
    conditionFilter,
    locationFilter,
    maintenanceDueFilter,
  ]);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  const totalAssets = assets.length;
  const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const inUseAssets = assets.filter(
    (asset) => asset.status === 'in-use'
  ).length;
  const maintenanceDueAssets = assets.filter((asset) =>
    isMaintenanceDue(asset)
  ).length;
  const underRepairAssets = assets.filter(
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <Cog className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Failed to load assets</EmptyTitle>
          <EmptyDescription>
            An unexpected error occurred. Please try again.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Assets"
        description="Track equipment, vehicles, and machinery"
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link href={routes.resources.assets.new}>
              <Cog className="mr-2 h-4 w-4" />
              Register Asset
            </Link>
          </Button>
        }
      />

      {/* Stats Cards */}
      <Card className="gap-0 p-6">
        <div className="lg:divide-border grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-0 lg:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 lg:rounded-none lg:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Assets
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {totalAssets}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Cog className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              registered assets
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 lg:rounded-none lg:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Value
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                ₹{(totalValue / 10_000_000).toFixed(1)}Cr
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <DollarSign className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              current book value
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 lg:rounded-none lg:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">In Use</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {inUseAssets}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <Activity className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              currently deployed
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 lg:rounded-none lg:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Maintenance Due
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                {maintenanceDueAssets}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <AlertCircle className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              need servicing
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 lg:rounded-none lg:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Under Repair
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
                {underRepairAssets}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                <Wrench className="size-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              in maintenance
            </p>
          </div>
        </div>
      </Card>

      {/* List Card */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, ID, manufacturer…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v as AssetType | 'all');
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="heavy-equipment">Heavy Equipment</SelectItem>
              <SelectItem value="light-equipment">Light Equipment</SelectItem>
              <SelectItem value="vehicle">Vehicle</SelectItem>
              <SelectItem value="tool">Tool</SelectItem>
              <SelectItem value="machinery">Machinery</SelectItem>
              <SelectItem value="generator">Generator</SelectItem>
              <SelectItem value="computer">Computer & IT</SelectItem>
              <SelectItem value="furniture">Furniture</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as AssetStatus | 'all');
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="in-use">In Use</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="repair">Under Repair</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
              <SelectItem value="disposed">Disposed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={conditionFilter}
            onValueChange={(v) => {
              setConditionFilter(v as AssetCondition | 'all');
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={locationFilter === 'all' ? 'all' : locationFilter.toString()}
            onValueChange={(v) => {
              setLocationFilter(v === 'all' ? 'all' : Number.parseInt(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id.toString()}>
                  {loc.locationName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={maintenanceDueFilter ? 'due' : 'all'}
            onValueChange={(v) => {
              setMaintenanceDueFilter(v === 'due');
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Maintenance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assets</SelectItem>
              <SelectItem value="due">Maintenance Due</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-2 border-l pl-3">
            <span className="text-xs whitespace-nowrap text-zinc-500">
              Rows per page
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(v) => {
                setItemsPerPage(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {paginatedAssets.length > 0 ? (
          <>
            <CardContent className="p-6">
              <div className="space-y-4">
                {paginatedAssets.map((asset) => (
                  <AssetListItem key={asset.id} asset={asset} />
                ))}
              </div>
            </CardContent>
            <div className="flex items-center justify-between border-t px-4 py-2">
              <span className="text-sm text-zinc-500">
                {startIndex + 1}–{Math.min(endIndex, filteredAssets.length)} of{' '}
                {filteredAssets.length} asset
                {filteredAssets.length === 1 ? '' : 's'}
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <CardContent>
            <Empty variant="default">
              <EmptyMedia variant="icon">
                <Cog className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No assets found</EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilters
                    ? 'Try adjusting your search or filters.'
                    : 'Get started by registering your first asset.'}
                </EmptyDescription>
              </EmptyHeader>
              {!hasActiveFilters && (
                <Button asChild>
                  <Link href={routes.resources.assets.new}>
                    <Cog className="mr-2 h-4 w-4" />
                    Register Asset
                  </Link>
                </Button>
              )}
            </Empty>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
