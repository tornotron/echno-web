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
import { useMaterials } from '@/hooks/materials';
import { MATERIAL_UNITS } from '@/features/materials/components/material-unit-selector';
import { MaterialList } from '@/features/materials/components';

const UNIT_FILTER_OPTIONS = [
  { value: 'all', label: 'All Units' },
  ...MATERIAL_UNITS.flatMap((g) =>
    g.units.map((u) => ({ value: u.value, label: u.label }))
  ),
];

export default function AllMaterialsPage() {
  const { data: materials = [], isLoading, isError } = useMaterials();

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

  const totalMaterials = materials.length;
  const uniqueUnits = new Set(materials.map((m) => m.unit)).size;
  const withSku = materials.filter((m) => m.sku).length;
  const totalStockValue = materials.reduce(
    (sum, m) => sum + (m.stockValue ?? 0),
    0
  );

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
                {totalMaterials}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Package className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              across all categories
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Stock Value
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                ₹{(totalStockValue / 100_000).toFixed(1)}L
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <WarehouseIcon className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              total inventory value
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Unique Units
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {uniqueUnits}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <Ruler className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              unit types in use
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
              have SKU assigned
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
