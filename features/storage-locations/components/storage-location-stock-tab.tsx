'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Input } from '@/components/shadcn/input';
import { Pagination } from '@/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { Loader2, Package, BarChart3, Layers, Search } from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { useStorageLocationStock } from '@tornotron/echno-core/inventory-transactions/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import type { LocationMaterialStock } from '@tornotron/echno-core/inventory-transactions/types';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

function StockStatusBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <Badge className="bg-zinc-100 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        Empty
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-100 text-xs text-green-700 dark:bg-green-900/40 dark:text-green-400">
      In Stock
    </Badge>
  );
}

interface StorageLocationStockTabProps {
  storageLocationId: number;
}

export function StorageLocationStockTab({
  storageLocationId,
}: StorageLocationStockTabProps) {
  const router = useRouter();
  const { data: locationStock, isLoading } =
    useStorageLocationStock(storageLocationId);
  const { data: projects = [] } = useProjects();

  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const locationProjectId = locationStock?.projectId;
  const locationProjectName = projects.find(
    (p) => p.id === locationProjectId
  )?.projectName;

  const filteredMaterials = useMemo((): LocationMaterialStock[] => {
    if (!locationStock) return [];
    if (
      projectFilter !== 'all' &&
      locationStock.projectId !== Number(projectFilter)
    )
      return [];
    const q = search.toLowerCase();
    return locationStock.materialStock.filter(
      (m) =>
        !search ||
        m.materialName.toLowerCase().includes(q) ||
        m.unit.toLowerCase().includes(q)
    );
  }, [locationStock, search, projectFilter]);

  const totalPages = Math.ceil(filteredMaterials.length / perPage);
  const startIndex = (page - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, filteredMaterials.length);
  const paginatedMaterials = filteredMaterials.slice(
    startIndex,
    startIndex + perPage
  );

  const hasActiveFilters = !!search || projectFilter !== 'all';

  const isAllSelected =
    paginatedMaterials.length > 0 &&
    paginatedMaterials.every((m) => selectedIds.includes(m.materialId));
  const isSomeSelected =
    !isAllSelected &&
    paginatedMaterials.some((m) => selectedIds.includes(m.materialId));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? paginatedMaterials.map((m) => m.materialId) : []);
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!locationStock || locationStock.materialStock.length === 0) {
    return (
      <Card>
        <CardContent>
          <Empty variant="default">
            <EmptyMedia variant="icon">
              <Package className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No stock found</EmptyTitle>
              <EmptyDescription>
                No materials are stored at this location yet.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Summary strip */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Stock
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {locationStock.totalStock.toLocaleString()}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Package className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              units stored
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Value
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                ₹{(locationStock.totalStockValue / 1000).toFixed(1)}K
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <BarChart3 className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              stock value
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Materials
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {locationStock.materialStock.length}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <Layers className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              distinct materials
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Project</p>
            <div className="flex items-center justify-between">
              <p className="truncate text-sm font-bold tracking-tight text-orange-600 dark:text-orange-400">
                {locationProjectName ?? '—'}
              </p>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              associated project
            </p>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search materials…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Select
            value={projectFilter}
            onValueChange={(v) => {
              setProjectFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-2 border-l pl-3">
            <span className="text-xs whitespace-nowrap text-zinc-500">
              Rows per page
            </span>
            <Select
              value={String(perPage)}
              onValueChange={(v) => {
                setPerPage(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {paginatedMaterials.length > 0 ? (
          <>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 pl-5">
                      <Checkbox
                        checked={
                          isSomeSelected ? 'indeterminate' : isAllSelected
                        }
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Stock Value</TableHead>
                    <TableHead className="pr-6 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMaterials.map((m) => (
                    <TableRow
                      key={m.materialId}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      onClick={() =>
                        router.push(
                          routes.resources.materials.detail(m.materialId).href
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === ' ') {
                          e.preventDefault();
                          router.push(
                            routes.resources.materials.detail(m.materialId).href
                          );
                        } else if (e.key === 'Enter')
                          router.push(
                            routes.resources.materials.detail(m.materialId).href
                          );
                      }}
                    >
                      <TableCell
                        className="pl-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedIds.includes(m.materialId)}
                          onCheckedChange={(checked) =>
                            handleSelectOne(m.materialId, checked as boolean)
                          }
                          aria-label={`Select ${m.materialName}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {m.materialName}
                      </TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-400">
                        {m.unit}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span
                          className={`font-semibold ${m.stock === 0 ? 'text-zinc-400' : ''}`}
                        >
                          {m.stock.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-zinc-700 tabular-nums dark:text-zinc-300">
                        ₹{m.stockValue.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <StockStatusBadge stock={m.stock} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <div className="flex items-center justify-between border-t px-4 py-2">
              <span className="text-sm text-zinc-500">
                {filteredMaterials.length === 0 ? 0 : startIndex + 1}–{endIndex}{' '}
                of {filteredMaterials.length} material
                {filteredMaterials.length === 1 ? '' : 's'}
              </span>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        ) : (
          <CardContent>
            <Empty variant="default">
              <EmptyMedia variant="icon">
                <Package className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No materials match your search</EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilters
                    ? 'Try adjusting your filters or search terms.'
                    : 'No materials are stored at this location yet.'}
                </EmptyDescription>
              </EmptyHeader>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setProjectFilter('all');
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </Empty>
          </CardContent>
        )}
      </Card>
    </>
  );
}
