'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, MoreVertical, Package } from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
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
import type {
  Material,
  MaterialStatus,
} from '@tornotron/echno-core/materials/types';
import { useOrganizationLowStock } from '@/features/materials/hooks/use-organization-low-stock';

const ITEMS_PER_PAGE_OPTIONS = ['5', '10', '20', '50'];

const TREND_COLORS = [
  '#22c55e',
  '#f59e0b',
  '#6366f1',
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) {
    return (
      <svg width={80} height={32}>
        <line
          x1={4}
          y1={16}
          x2={76}
          y2={16}
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="4 2"
          opacity={0.4}
        />
      </svg>
    );
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80,
    h = 32,
    pad = 4;
  const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (w - pad * 2));
  const ys = data.map((v) => h - pad - ((v - min) / range) * (h - pad * 2));
  const pathD = xs
    .map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`)
    .join(' ');
  const lastX = xs.at(-1) ?? 0;
  const firstX = xs[0] ?? 0;

  const areaD = `${pathD} L${lastX.toFixed(1)},${h} L${firstX.toFixed(1)},${h} Z`;
  const gradId = `grad-${color.replace('#', '')}`;

  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={2} fill={color} />
      ))}
    </svg>
  );
}

function StatusBadge({ status }: { status: MaterialStatus }) {
  const config: Record<
    MaterialStatus,
    { dot: string; text: string; bg: string; label: string }
  > = {
    IN_STOCK: {
      dot: 'bg-green-500',
      text: 'text-green-700 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950/30',
      label: 'In Stock',
    },
    LOW_STOCK: {
      dot: 'bg-amber-500',
      text: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      label: 'Low Stock',
    },
    OUT_OF_STOCK: {
      dot: 'bg-red-500',
      text: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/30',
      label: 'Out of Stock',
    },
  };
  const cfg = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/**
 * The status badge for one loaded row.
 *
 * `lowMaterialIds` is the server's answer to which materials have reached
 * their reorder level, and it decides `LOW_STOCK` here so the badge, the
 * filter and the Low Stock Alert card cannot disagree. The local
 * comparison remains only as the fallback for the moment before that
 * answer arrives, and `MaterialDto` carries no `status` field, so there is
 * nothing on the row to prefer over either.
 */
function deriveStatus(m: Material, lowMaterialIds?: ReadonlySet<number>): MaterialStatus {
  if (m.currentStock === 0) return 'OUT_OF_STOCK';
  if (lowMaterialIds) return lowMaterialIds.has(m.id) ? 'LOW_STOCK' : 'IN_STOCK';
  if (
    m.currentStock !== undefined &&
    m.reorderLevel !== undefined &&
    m.currentStock <= m.reorderLevel
  )
    return 'LOW_STOCK';
  return 'IN_STOCK';
}

export function MaterialsDashboardTable({
  materials,
}: {
  materials: Material[];
}) {
  const router = useRouter();
  const {
    materialIds: lowMaterialIds,
    total: lowStockTotal,
    isLoading: isLowStockLoading,
    isError: isLowStockError,
  } = useOrganizationLowStock();
  const lowStockAnswer =
    isLowStockLoading || isLowStockError ? undefined : lowMaterialIds;

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const categoryOptions = useMemo(() => {
    const cats = [
      ...new Set(materials.map((m) => m.category).filter(Boolean)),
    ].toSorted();
    return cats.map((c) => ({ value: c!, label: c! }));
  }, [materials]);

  const totalStockValue = useMemo(
    () => materials.reduce((sum, m) => sum + (m.stockValue ?? 0), 0),
    [materials]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return materials.filter((m) => {
      const matchesSearch =
        !q ||
        m.materialName.toLowerCase().includes(q) ||
        (m.sku ?? '').toLowerCase().includes(q);
      const matchesCategory =
        categoryFilter === 'all' || m.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        deriveStatus(m, lowStockAnswer) === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [materials, searchQuery, categoryFilter, statusFilter, lowStockAnswer]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };
  const handleItemsPerPage = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="gap-3 border-b px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* On mobile: search + filter on one row; on sm+ dissolves into parent flex */}
          <div className="flex items-center gap-2 sm:contents">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search materials..."
                className="h-9 pl-8 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0 px-3"
              disabled
              title="Filters coming soon"
            >
              <SlidersHorizontal className="size-4" />
            </Button>
          </div>

          {/* On mobile: category + status on one row; on sm+ dissolves into parent flex */}
          <div className="flex items-center gap-2 sm:contents">
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger className="h-9 flex-1 text-sm sm:w-[150px] sm:flex-none">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-9 flex-1 text-sm sm:w-[130px] sm:flex-none">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="IN_STOCK">In Stock</SelectItem>
                <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {statusFilter === 'LOW_STOCK' &&
          !searchQuery &&
          categoryFilter === 'all' &&
          lowStockTotal !== undefined &&
          lowStockTotal > filtered.length && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {lowStockTotal} materials are at or below their reorder level.{' '}
              {filtered.length} of them are on this list, which is limited to
              the materials this page loaded.
            </p>
          )}
        {statusFilter === 'LOW_STOCK' && isLowStockError && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Reorder levels could not be read from the server, so this list is
            filtered on the stock figures already loaded and may be short.
          </p>
        )}
      </CardHeader>

      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px] pl-5">Material</TableHead>
              <TableHead className="min-w-[130px]">Category</TableHead>
              <TableHead className="min-w-[170px]">Stock</TableHead>
              <TableHead className="min-w-[120px]">Stock Value</TableHead>
              <TableHead className="min-w-[100px]">Trend</TableHead>
              <TableHead className="min-w-[110px]">Status</TableHead>
              <TableHead className="w-14 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Empty variant="inline">
                    <EmptyMedia variant="icon">
                      <Package className="size-6" />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>No materials found</EmptyTitle>
                      <EmptyDescription>
                        {searchQuery ||
                        categoryFilter !== 'all' ||
                        statusFilter !== 'all'
                          ? 'Try adjusting your search or filters.'
                          : 'Get started by adding your first material.'}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {paginated.map((m, idx) => {
              const trendColor = TREND_COLORS[idx % TREND_COLORS.length];
              const status = deriveStatus(m, lowStockAnswer);
              const stockPct =
                m.maxStock && m.maxStock > 0
                  ? Math.round(((m.currentStock ?? 0) / m.maxStock) * 100)
                  : null;
              const valuePct =
                totalStockValue > 0
                  ? Math.round(((m.stockValue ?? 0) / totalStockValue) * 100)
                  : null;

              return (
                <TableRow
                  key={m.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() =>
                    router.push(routes.resources.materials.detail(m.id).href)
                  }
                >
                  {/* Material */}
                  <TableCell className="py-4 pl-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                        <Package className="size-5 text-zinc-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="leading-tight font-semibold text-zinc-900 dark:text-zinc-100">
                          {m.materialName}
                        </p>
                        {m.unit && (
                          <Badge
                            variant="secondary"
                            className="h-5 text-xs font-normal"
                          >
                            {m.unit}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="text-sm text-zinc-500">
                    {m.category ?? '—'}
                  </TableCell>

                  {/* Stock */}
                  <TableCell className="py-4">
                    <div className="min-w-[140px] space-y-1.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {stockPct === null
                            ? (m.currentStock ?? '—')
                            : `${stockPct}%`}
                        </span>
                        {valuePct !== null && (
                          <span className="text-xs text-zinc-400">
                            ({valuePct}% of total)
                          </span>
                        )}
                      </div>
                      {stockPct !== null && (
                        <div className="h-1.5 w-32 rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(stockPct, 100)}%`,
                              backgroundColor: trendColor,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Stock Value */}
                  <TableCell className="text-zinc-700 tabular-nums dark:text-zinc-300">
                    {m.stockValue === undefined
                      ? '—'
                      : `₹${m.stockValue.toLocaleString('en-IN')}`}
                  </TableCell>

                  {/* Trend */}
                  <TableCell>
                    <Sparkline data={m.trend ?? []} color={trendColor} />
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <StatusBadge status={status} />
                  </TableCell>

                  {/* Actions */}
                  <TableCell
                    className="pr-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              routes.resources.materials.detail(m.id).href
                            )
                          }
                        >
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              routes.resources.materials.detail(m.id).edit
                            )
                          }
                        >
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Showing {filtered.length === 0 ? 0 : startIndex + 1} to{' '}
          {Math.min(startIndex + itemsPerPage, filtered.length)} of{' '}
          {filtered.length} materials
        </span>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="flex items-center gap-2">
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
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </Card>
  );
}
