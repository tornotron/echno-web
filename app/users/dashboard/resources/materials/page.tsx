'use client';

import { useMemo, useState } from 'react';
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
import { Package, Plus, Tag, Ruler, WarehouseIcon } from 'lucide-react';
import { useMaterials } from '@/hooks/materials';
import { MATERIAL_UNITS } from '@/features/materials/components/material-unit-selector';

// Flat unit options for filter dropdown
const UNIT_FILTER_OPTIONS = [
  { value: 'all', label: 'All Units' },
  ...MATERIAL_UNITS.flatMap((g) =>
    g.units.map((u) => ({ value: u.value, label: u.label }))
  ),
];

export default function MaterialsPage() {
  const { data: materials = [], isLoading, isError, error } = useMaterials();

  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        m.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.sku ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUnit = unitFilter === 'all' || m.unit === unitFilter;
      return matchesSearch && matchesUnit;
    });
  }, [materials, searchQuery, unitFilter]);

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = filteredMaterials.slice(startIndex, endIndex);

  const hasActiveFilters = Boolean(searchQuery || unitFilter !== 'all');

  const clearFilters = () => {
    setSearchQuery('');
    setUnitFilter('all');
    setCurrentPage(1);
  };

  // Stats
  const totalMaterials = materials.length;
  const uniqueUnits = new Set(materials.map((m) => m.unit)).size;
  const withSku = materials.filter((m) => m.sku).length;
  const totalStockValue = materials.reduce(
    (sum, m) => sum + (m.stockValue ?? 0),
    0
  );

  const materialsContent =
    filteredMaterials.length > 0 ? (
      <>
        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to{' '}
            {Math.min(endIndex, filteredMaterials.length)} of{' '}
            {filteredMaterials.length} materials
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Rows per page:
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(v) => {
                setItemsPerPage(Number(v));
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
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {paginated.map((material) => (
                <Link
                  key={material.id}
                  href={`/users/dashboard/resources/materials/${material.id}`}
                  className="block"
                >
                  <div className="rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-blue-600">
                            <Package className="h-6 w-6 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                {material.materialName}
                              </h3>
                              {material.sku && (
                                <span className="text-xs text-zinc-500">
                                  {material.sku}
                                </span>
                              )}
                            </div>
                            {material.description && (
                              <p className="mt-1 line-clamp-1 text-sm text-zinc-600 dark:text-zinc-400">
                                {material.description}
                              </p>
                            )}
                            {material.hsn && (
                              <p className="mt-0.5 text-xs text-zinc-500">
                                HSN: {material.hsn}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className="shrink-0 self-start lg:self-auto"
                      >
                        {material.unit}
                      </Badge>

                      <div className="grid grid-cols-3 gap-4 lg:w-auto">
                        <div className="text-center">
                          <div className="mb-1 text-xs text-zinc-500">
                            Current Stock
                          </div>
                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {material.currentStock === undefined
                              ? '—'
                              : `${material.currentStock} ${material.unit}`}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="mb-1 text-xs text-zinc-500">
                            Stock Value
                          </div>
                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {material.stockValue === undefined
                              ? '—'
                              : `₹${material.stockValue.toLocaleString('en-IN')}`}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="mb-1 text-xs text-zinc-500">
                            Reorder At
                          </div>
                          <div
                            className={`text-sm font-semibold ${
                              material.reorderLevel !== undefined &&
                              material.currentStock !== undefined &&
                              material.currentStock <= material.reorderLevel
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-zinc-900 dark:text-zinc-100'
                            }`}
                          >
                            {material.reorderLevel === undefined
                              ? '—'
                              : material.reorderLevel}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
      </>
    ) : (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
          <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            No materials found
          </h3>
          <p className="mb-4 text-zinc-600 dark:text-zinc-400">
            {hasActiveFilters
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first material'}
          </p>
          {!hasActiveFilters && (
            <Button asChild>
              <Link href="/users/dashboard/resources/materials/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
            Materials
          </h1>
          <p className="mt-1 text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
            Manage materials and track stock levels
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/users/dashboard/resources/materials/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Material
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Total Materials
            </CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMaterials}</div>
            <p className="text-muted-foreground text-xs">Registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Stock Value
            </CardTitle>
            <WarehouseIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₹{(totalStockValue / 100_000).toFixed(1)}L
            </div>
            <p className="text-muted-foreground text-xs">Total stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              Unique Units
            </CardTitle>
            <Ruler className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {uniqueUnits}
            </div>
            <p className="text-muted-foreground text-xs">Unit types in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium sm:text-sm">
              With SKU
            </CardTitle>
            <Tag className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{withSku}</div>
            <p className="text-muted-foreground text-xs">SKU assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by name or SKU..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Unit',
            options: UNIT_FILTER_OPTIONS,
            value: unitFilter,
            onChange: (v) => {
              setUnitFilter(v);
              setCurrentPage(1);
            },
          },
        ]}
      />

      {isLoading ? (
        <Card>
          <CardContent className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-600" />
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-red-400" />
            <h3 className="mb-2 text-lg font-medium">
              Failed to load materials
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {error instanceof Error
                ? error.message
                : 'An unexpected error occurred.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        materialsContent
      )}
    </div>
  );
}
