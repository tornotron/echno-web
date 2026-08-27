'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import {
  Loader2,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  MapPin,
  FolderOpen,
  Hash,
} from 'lucide-react';
import { format } from 'date-fns';
import { useMaterialMovementHistory } from '@tornotron/echno-core/inventory-transactions/hooks';
import {
  InventoryTransactionType,
  StockDirection,
  inventoryTransactionTypeLabels,
  inventoryTransactionTypeBadgeColors,
} from '@tornotron/echno-core/inventory-transactions/types';
import type { MaterialMovementHistoryEntry } from '@tornotron/echno-core/inventory-transactions/types';
import { ApiError } from '@/lib/api/api-client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TX_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  ...Object.values(InventoryTransactionType).map((v) => ({
    value: v,
    label: inventoryTransactionTypeLabels[v],
  })),
];

/** How many movements the first request asks for, and each "Show more" adds. */
const PAGE_STEP = 20;

type Direction = 'in' | 'out' | 'flat';

/**
 * Resolves the arrow and colour for a movement. The server states the
 * direction the movement type moves stock in; only EITHER (adjustments) leaves
 * it to the signed quantity.
 */
function directionOf(entry: MaterialMovementHistoryEntry): Direction {
  if (entry.direction === StockDirection.increase) return 'in';
  if (entry.direction === StockDirection.decrease) return 'out';
  if (entry.quantityChanged > 0) return 'in';
  if (entry.quantityChanged < 0) return 'out';
  return 'flat';
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MaterialMovementTimelineTabProps {
  materialId: number;
  unit: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MaterialMovementTimelineTab({
  materialId,
  unit,
}: MaterialMovementTimelineTabProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loaded, setLoaded] = useState(PAGE_STEP);

  // The backend serves the history already ordered, oldest movement first, so
  // the timeline runs forward in time and "Show more" walks towards the
  // present. Growing the page size keeps the movements already on screen in
  // place while the longer page loads.
  const { data, isLoading, isFetching, isError, error } =
    useMaterialMovementHistory(materialId, 0, loaded);

  const movements = data?.content ?? [];
  const totalMovements = data?.totalElements ?? 0;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return movements.filter((entry) => {
      const matchesSearch =
        !search ||
        (entry.referenceNumber ?? '').toLowerCase().includes(q) ||
        entry.storageLocationName.toLowerCase().includes(q) ||
        entry.projectName.toLowerCase().includes(q);
      const matchesType =
        typeFilter === 'all' || entry.transactionType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [movements, search, typeFilter]);

  const hasActiveFilters = Boolean(search || typeFilter !== 'all');
  const remaining = totalMovements - movements.length;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  // ── Graceful degradation ─────────────────────────────────────────────────────
  // The movement-history endpoint may not be deployed in every environment
  // yet. A 404 (or any read failure) degrades to a neutral placeholder rather
  // than an error page, so the rest of the material view keeps working.
  if (isError) {
    const notDeployed = error instanceof ApiError && error.isNotFound;
    return (
      <Card>
        <CardContent>
          <Empty variant="default">
            <EmptyMedia variant="icon">
              <History className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {notDeployed
                  ? 'Movement history not available yet'
                  : 'Could not load movement history'}
              </EmptyTitle>
              <EmptyDescription>
                {notDeployed
                  ? 'Stock movements will appear here once the inventory-transaction history is enabled for this environment.'
                  : 'The movement history could not be loaded. Please try again shortly.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (movements.length === 0) {
    return (
      <Card>
        <CardContent>
          <Empty variant="default">
            <EmptyMedia variant="icon">
              <History className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No movements yet</EmptyTitle>
              <EmptyDescription>
                Stock movements for this material will appear here as goods are
                received, consumed or transferred.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <History className="h-4 w-4" />
          Movement History
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, location or project…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {TX_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              setSearch('');
              setTypeFilter('all');
            }}
          >
            Clear
          </Button>
        )}
        <span className="ml-auto text-xs text-zinc-500">
          {hasActiveFilters
            ? `${filtered.length} of ${movements.length} loaded`
            : `${movements.length} of ${totalMovements} movement${totalMovements === 1 ? '' : 's'}`}
        </span>
      </CardHeader>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <Empty variant="default">
            <EmptyMedia variant="icon">
              <History className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No movements match your filters</EmptyTitle>
              <EmptyDescription>
                Try adjusting your search or type filter.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ol className="relative px-4 py-4 sm:px-6">
            {/* Vertical rail */}
            <span
              aria-hidden
              className="absolute top-6 bottom-6 left-[1.35rem] w-px bg-zinc-200 sm:left-[2.1rem] dark:bg-zinc-800"
            />
            {filtered.map((entry) => (
              <TimelineRow key={entry.id} entry={entry} unit={unit} />
            ))}
          </ol>
        )}

        {/* Stays visible under an empty filter result: the next page may hold
            the movements the filter is looking for. */}
        {remaining > 0 && (
          <div className="flex justify-center border-t px-4 py-3">
            <Button
              variant="outline"
              size="sm"
              disabled={isFetching}
              onClick={() => setLoaded((n) => n + PAGE_STEP)}
            >
              {isFetching && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              Show more ({remaining} remaining)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Timeline row
// ---------------------------------------------------------------------------

function TimelineRow({
  entry,
  unit,
}: {
  entry: MaterialMovementHistoryEntry;
  unit: string;
}) {
  const direction = directionOf(entry);
  const abs = Math.abs(entry.quantityChanged);

  let dotClass =
    'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';
  let qtyClass = 'text-zinc-500';
  let sign = '';
  let DirIcon = Minus;
  if (direction === 'in') {
    dotClass =
      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
    qtyClass = 'text-green-700 dark:text-green-400';
    sign = '+';
    DirIcon = TrendingUp;
  } else if (direction === 'out') {
    dotClass = 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
    qtyClass = 'text-red-700 dark:text-red-400';
    sign = '−';
    DirIcon = TrendingDown;
  }

  return (
    <li className="relative flex gap-4 pb-6 last:pb-0 sm:gap-5">
      {/* Dot */}
      <div
        className={`z-10 flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white sm:size-11 dark:ring-zinc-950 ${dotClass}`}
      >
        <DirIcon className="size-4 sm:size-5" />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={
              inventoryTransactionTypeBadgeColors[entry.transactionType]
            }
          >
            {inventoryTransactionTypeLabels[entry.transactionType]}
          </Badge>
          <span className={`text-sm font-semibold tabular-nums ${qtyClass}`}>
            {sign}
            {abs.toLocaleString('en-IN')} {unit}
          </span>
          <span className="ml-auto text-xs whitespace-nowrap text-zinc-400 dark:text-zinc-500">
            {format(new Date(entry.transactionDate), 'MMM dd, yyyy · HH:mm')}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5 shrink-0" />
            {entry.storageLocationName}
          </span>
          {entry.projectName && (
            <span className="flex items-center gap-1">
              <FolderOpen className="size-3.5 shrink-0" />
              {entry.projectName}
            </span>
          )}
          {entry.referenceNumber && (
            <span className="flex items-center gap-1">
              <Hash className="size-3.5 shrink-0" />
              {entry.referenceNumber}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
