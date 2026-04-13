'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pagination, SearchAndFilter } from '@/components/common';
import { Loader2, Package, ExternalLink } from 'lucide-react';
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
    const q = search.toLowerCase();
    return locationStock.materialStock.filter(
      (m) =>
        !search ||
        m.materialName.toLowerCase().includes(q) ||
        m.unit.toLowerCase().includes(q)
    );
  }, [locationStock, search]);

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
        <CardContent className="py-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <p className="text-muted-foreground text-sm">
            No materials stored at this location.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">Total Stock</div>
            <div className="text-lg font-bold">
              {locationStock.totalStock.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">Total Value</div>
            <div className="text-lg font-bold">
              ₹{locationStock.totalStockValue.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">Materials</div>
            <div className="text-lg font-bold">
              {locationStock.materialStock.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">Project</div>
            <div className="truncate text-sm font-semibold">
              {locationProjectName ?? '—'}
            </div>
          </CardContent>
        </Card>
      </div>

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
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">
                No materials match your search.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
              >
                Clear search
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-zinc-50 dark:bg-zinc-900/40">
                    <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                      Material
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">
                      Stock Value
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">
                      View
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedMaterials.map((m) => (
                    <tr
                      key={m.materialId}
                      className={`transition-colors ${
                        m.stock === 0
                          ? 'bg-zinc-50/50 dark:bg-zinc-900/20'
                          : 'hover:bg-accent/40'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                        {m.materialName}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {m.unit}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span
                          className={`font-semibold ${
                            m.stock === 0 ? 'text-zinc-400' : ''
                          }`}
                        >
                          {m.stock.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-700 tabular-nums dark:text-zinc-300">
                        ₹{m.stockValue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StockStatusBadge stock={m.stock} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() =>
                            router.push(
                              `/users/dashboard/resources/materials/${m.materialId}`
                            )
                          }
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
