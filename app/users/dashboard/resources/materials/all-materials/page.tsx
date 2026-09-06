'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { routes } from '@/nav';
import { Card } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import {
  Package,
  Plus,
  Tag,
  Ruler,
  WarehouseIcon,
  Loader2,
} from 'lucide-react';
import { useMaterials } from '@tornotron/echno-core/materials/hooks';
import { MATERIAL_UNITS } from '@/features/materials/components/material-unit-selector';
import { MaterialList } from '@/features/materials/components';
import { useMaterialsSummary } from '@/features/materials/hooks/use-materials-summary';
import {
  formatStockValue,
  stockValueCaption,
  unavailableCaption,
} from '@/features/materials/lib/stock-summary-captions';

const UNIT_FILTER_OPTIONS = [
  { value: 'all', label: 'All Units' },
  ...MATERIAL_UNITS.flatMap((g) =>
    g.units.map((u) => ({ value: u.value, label: u.label }))
  ),
];

export default function AllMaterialsPage() {
  const { data: materials = [], isLoading, isError } = useMaterials();

  // Three of the four tiles are the server's totals, summed in the
  // database over the whole organization. None of them can be worked out
  // from `materials`: that array is GET /materials/web, which stops at 500
  // rows, so a length is 500 however large the catalogue is, a reduce over
  // stockValue is the value of 500 holdings, and a Set of units counts
  // only the units those 500 happen to be held in. All three fail short,
  // which is the direction nobody checks. The scope is the organization,
  // matching the unscoped useMaterials list this page shows: there is no
  // project in the route and no project picker on the screen.
  const {
    materialCount,
    distinctUnits,
    totalStockValue,
    unvaluedHoldingCount,
    holdsWholeCatalogue,
    isLoading: isSummaryLoading,
  } = useMaterialsSummary(materials.length);

  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        m.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.sku ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUnit =
        unitFilter === 'all' ||
        m.unit.toLowerCase() === unitFilter.toLowerCase();
      return matchesSearch && matchesUnit;
    });
  }, [materials, searchQuery, unitFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMaterials.length / itemsPerPage)
  );
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginated = filteredMaterials.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const hasActiveFilters = Boolean(searchQuery || unitFilter !== 'all');

  // Materials on hand carrying a SKU. The only tile still counted in the
  // browser, because the summary endpoint totals no SKUs, so it says what
  // it counted whenever those rows are not the whole catalogue.
  const withSku = materials.filter((m) => m.sku).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="All Materials"
        description="Browse and manage all materials in your inventory"
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link href={routes.resources.materials.new}>
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Link>
          </Button>
        }
      />

      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Materials
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {materialCount ?? '—'}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Package className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {materialCount === undefined
                ? unavailableCaption(isSummaryLoading)
                : 'across all categories'}
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Stock Value
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {totalStockValue === undefined
                  ? '—'
                  : formatStockValue(totalStockValue)}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <WarehouseIcon className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {stockValueCaption({
                totalStockValue,
                unvaluedHoldingCount,
                isLoading: isSummaryLoading,
              })}
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Unique Units
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {distinctUnits ?? '—'}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <Ruler className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {distinctUnits === undefined
                ? unavailableCaption(isSummaryLoading)
                : 'unit types in use'}
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">With SKU</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                {withSku}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <Tag className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {holdsWholeCatalogue
                ? 'have SKU assigned'
                : `of the ${materials.length} loaded`}
            </p>
          </div>
        </div>
      </Card>

      <MaterialList
        paginated={paginated}
        filteredCount={filteredMaterials.length}
        startIndex={startIndex}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(n) => {
          setItemsPerPage(n);
          setCurrentPage(1);
        }}
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        hasActiveFilters={hasActiveFilters}
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        unitFilter={unitFilter}
        onUnitChange={(v) => {
          setUnitFilter(v);
          setCurrentPage(1);
        }}
        unitFilterOptions={UNIT_FILTER_OPTIONS}
        isError={isError}
      />
    </div>
  );
}
