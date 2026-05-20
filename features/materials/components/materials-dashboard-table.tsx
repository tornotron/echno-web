'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package } from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
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
import { Pagination } from '@/components/common';
import { routes } from '@/nav';
import type { Material } from '@/types/materials';

const ITEMS_PER_PAGE_OPTIONS = ['5', '10', '20', '50'];

export function MaterialsDashboardTable({
  materials,
}: {
  materials: Material[];
}) {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const unitOptions = useMemo(() => {
    const units = [
      ...new Set(materials.map((m) => m.unit).filter(Boolean)),
    ].toSorted();
    return units.map((u) => ({ value: u, label: u }));
  }, [materials]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return materials.filter((m) => {
      const matchesSearch =
        !q ||
        m.materialName.toLowerCase().includes(q) ||
        (m.sku ?? '').toLowerCase().includes(q);
      const matchesUnit =
        unitFilter === 'all' ||
        m.unit.toLowerCase() === unitFilter.toLowerCase();
      return matchesSearch && matchesUnit;
    });
  }, [materials, searchQuery, unitFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const isAllSelected =
    paginated.length > 0 && paginated.every((m) => selectedIds.includes(m.id));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? paginated.map((m) => m.id) : []);
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleUnitChange = (value: string) => {
    setUnitFilter(value);
    setCurrentPage(1);
  };

  const handleItemsPerPage = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-6">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="h-8 pl-8 text-sm"
          />
        </div>

        <Select value={unitFilter} onValueChange={handleUnitChange}>
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue placeholder="All Units" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Units</SelectItem>
            {unitOptions.map((o) => (
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
            value={String(itemsPerPage)}
            onValueChange={handleItemsPerPage}
          >
            <SelectTrigger className="h-8 w-[60px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 pl-5">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Reorder At</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Empty variant="inline">
                    <EmptyMedia variant="icon">
                      <Package className="size-6" />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>No materials found</EmptyTitle>
                      <EmptyDescription>
                        {searchQuery || unitFilter !== 'all'
                          ? 'Try adjusting your search or filters.'
                          : 'Get started by adding your first material.'}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {paginated.map((m) => {
              const isLow =
                m.reorderLevel !== undefined &&
                m.currentStock !== undefined &&
                m.currentStock <= m.reorderLevel;
              return (
                <TableRow
                  key={m.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() =>
                    router.push(routes.resources.materials.detail(m.id).href)
                  }
                >
                  <TableCell
                    className="pl-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedIds.includes(m.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(m.id, checked as boolean)
                      }
                      aria-label={`Select ${m.materialName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {m.materialName}
                    </p>
                    {m.sku && <p className="text-xs text-zinc-500">{m.sku}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{m.unit}</Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium tabular-nums ${
                      isLow
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {m.currentStock ?? '—'}
                  </TableCell>
                  <TableCell className="text-right text-zinc-500 tabular-nums dark:text-zinc-400">
                    {m.reorderLevel ?? '—'}
                  </TableCell>
                  <TableCell className="text-right text-zinc-700 tabular-nums dark:text-zinc-300">
                    {m.stockValue === undefined
                      ? '—'
                      : `₹${m.stockValue.toLocaleString('en-IN')}`}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <div className="flex items-center justify-between border-t px-4 py-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Showing {filtered.length === 0 ? 0 : startIndex + 1}–
          {Math.min(startIndex + itemsPerPage, filtered.length)} of{' '}
          {filtered.length}
        </span>
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </Card>
  );
}
