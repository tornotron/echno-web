'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { routes } from '@/nav';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
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
  Package,
  Plus,
  Tag,
  Ruler,
  WarehouseIcon,
  Loader2,
  Search,
} from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { useMaterials } from '@/hooks/materials';
import { MATERIAL_UNITS } from '@/features/materials/components/material-unit-selector';

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
      const matchesUnit =
        unitFilter === 'all' ||
        m.unit.toLowerCase() === unitFilter.toLowerCase();
      return matchesSearch && matchesUnit;
    });
  }, [materials, searchQuery, unitFilter]);

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(
    startIndex + itemsPerPage,
    filteredMaterials.length
  );
  const paginated = filteredMaterials.slice(startIndex, endIndex);

  const hasActiveFilters = Boolean(searchQuery || unitFilter !== 'all');

  let cardBody: React.ReactNode;
  if (isLoading) {
    cardBody = (
      <CardContent className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </CardContent>
    );
  } else if (isError) {
    cardBody = (
      <CardContent className="py-12 text-center">
        <Package className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <h3 className="mb-2 text-lg font-medium">Failed to load materials</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          {error instanceof Error
            ? error.message
            : 'An unexpected error occurred.'}
        </p>
      </CardContent>
    );
  } else if (paginated.length > 0) {
    cardBody = (
      <>
        <CardContent className="p-6">
          <div className="space-y-4">
            {paginated.map((material) => (
              <Link
                key={material.id}
                href={routes.resources.materials.detail(material.id).href}
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
        <div className="flex items-center justify-between border-t px-4 py-2">
          <span className="text-sm text-zinc-500">
            {startIndex + 1}–{endIndex} of {filteredMaterials.length} material
            {filteredMaterials.length === 1 ? '' : 's'}
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </>
    );
  } else {
    cardBody = (
      <CardContent>
        <Empty variant="default">
          <EmptyMedia variant="icon">
            <Package className="size-6" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No materials found</EmptyTitle>
            <EmptyDescription>
              {hasActiveFilters
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first material.'}
            </EmptyDescription>
          </EmptyHeader>
          {!hasActiveFilters && (
            <Button asChild>
              <Link href={routes.resources.materials.new}>
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Link>
            </Button>
          )}
        </Empty>
      </CardContent>
    );
  }

  const totalMaterials = materials.length;
  const uniqueUnits = new Set(materials.map((m) => m.unit)).size;
  const withSku = materials.filter((m) => m.sku).length;
  const totalStockValue = materials.reduce(
    (sum, m) => sum + (m.stockValue ?? 0),
    0
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Materials"
        description="Manage materials and track stock levels"
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link href={routes.resources.materials.new}>
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Link>
          </Button>
        }
      />

      {/* Stats Cards */}
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

      {/* List Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name or SKU…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Select
            value={unitFilter}
            onValueChange={(v) => {
              setUnitFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              {UNIT_FILTER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
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
                {[5, 10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {cardBody}
      </Card>
    </div>
  );
}
