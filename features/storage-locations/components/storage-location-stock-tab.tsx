'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Card, CardContent } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
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
import { Pagination, SearchAndFilter } from '@/components/common';
import {
  Loader2,
  Package,
  ExternalLink,
  BarChart3,
  Layers,
} from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { useStorageLocationStock } from '@/hooks/inventory-transactions/use-inventory-transactions';
import { useProjects } from '@/hooks/project/use-projects';
import type { LocationMaterialStock } from '@/types/inventory-transactions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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

  // The endpoint returns a projectId at root (the location's associated project).
  // Use it to pre-select the project filter when the location belongs to a project.
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
  const paginatedMaterials = filteredMaterials.slice(
    startIndex,
    startIndex + perPage
  );

  const hasActiveFilters = !!search || projectFilter !== 'all';

  // ---------------------------------------------------------------------------

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

      {/* Filters */}
      <SearchAndFilter
        variant="card"
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search materials..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() => {
          setSearch('');
          setProjectFilter('all');
          setPage(1);
        }}
        filters={[
          {
            placeholder: 'All Projects',
            options: [
              { value: 'all', label: 'All Projects' },
              ...projects.map((p) => ({
                value: p.id.toString(),
                label: p.projectName,
              })),
            ],
            value: projectFilter,
            onChange: (v) => {
              setProjectFilter(v);
              setPage(1);
            },
            width: 'w-full sm:w-[220px]',
          },
        ]}
      />

      {/* Results summary + rows per page */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {filteredMaterials.length === 0 ? 0 : startIndex + 1} to{' '}
          {Math.min(startIndex + perPage, filteredMaterials.length)} of{' '}
          {filteredMaterials.length} materials
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Rows per page:
          </span>
          <Select
            value={perPage.toString()}
            onValueChange={(v) => {
              setPerPage(Number(v));
              setPage(1);
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {paginatedMaterials.length === 0 ? (
            <Empty variant="inline">
              <EmptyMedia variant="icon">
                <Package className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No materials match your search</EmptyTitle>
                <EmptyDescription>
                  Try adjusting your filters or search terms.
                </EmptyDescription>
              </EmptyHeader>
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
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Stock Value</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="text-right">View</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMaterials.map((m) => (
                  <TableRow key={m.materialId}>
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
                    <TableCell className="text-right">
                      <StockStatusBadge stock={m.stock} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-xs"
                        aria-label="View material"
                        onClick={() =>
                          router.push(
                            routes.resources.materials.detail(m.materialId).href
                          )
                        }
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </Card>
    </>
  );
}
