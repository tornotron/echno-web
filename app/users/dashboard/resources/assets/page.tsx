'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { routes } from '@/nav';
import { Card } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { PageHeader, ActiveFilterChip } from '@/components/common';
import {
  useEmployeeFilterFromParams,
  rowMatchesEmployeeFilter,
  ROLE_LABELS,
} from '@/hooks/use-employee-filter';
import {
  Activity,
  AlertCircle,
  Cog,
  DollarSign,
  Loader2,
  Wrench,
} from 'lucide-react';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import {
  AssetType,
  AssetStatus,
  AssetCondition,
  isMaintenanceDue,
} from '@/types/resource';
import { useAssets } from '@/hooks/assets';
import { useStorageLocations } from '@tornotron/echno-core/storage-locations/hooks';
import { AssetList } from '@/features/assets/components';

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
  const { employeeId, role, name, clear } = useEmployeeFilterFromParams();

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
      const matchesEmployee =
        employeeId == null ||
        role == null ||
        rowMatchesEmployeeFilter(asset, employeeId, role, {
          assignee: (a) => a.assignedToId,
        });
      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesCondition &&
        matchesLocation &&
        matchesMaintenanceDue &&
        matchesEmployee
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
    employeeId,
    role,
  ]);

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filteredAssets.slice(startIndex, startIndex + itemsPerPage);

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

      {employeeId != null && name && (
        <ActiveFilterChip
          label={ROLE_LABELS[role ?? ''] ?? 'Filtered by'}
          name={name}
          onDismiss={clear}
        />
      )}

      <AssetList
        paginated={paginated}
        filteredCount={filteredAssets.length}
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
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        typeFilter={typeFilter}
        onTypeChange={(v) => {
          setTypeFilter(v as AssetType | 'all');
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(v) => {
          setStatusFilter(v as AssetStatus | 'all');
          setCurrentPage(1);
        }}
        conditionFilter={conditionFilter}
        onConditionChange={(v) => {
          setConditionFilter(v as AssetCondition | 'all');
          setCurrentPage(1);
        }}
        locationFilter={
          locationFilter === 'all' ? 'all' : locationFilter.toString()
        }
        onLocationChange={(v) => {
          setLocationFilter(v === 'all' ? 'all' : Number.parseInt(v));
          setCurrentPage(1);
        }}
        locations={locations}
        maintenanceDueFilter={maintenanceDueFilter}
        onMaintenanceDueChange={(v) => {
          setMaintenanceDueFilter(v);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
