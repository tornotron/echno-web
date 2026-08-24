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
import { useInventoryTransactionsByMaterial } from '@tornotron/echno-core/inventory-transactions/hooks';
import {
  InventoryTransactionType,
  inventoryTransactionTypeLabels,
  inventoryTransactionTypeBadgeColors,
} from '@tornotron/echno-core/inventory-transactions/types';
import type { InventoryTransaction } from '@tornotron/echno-core/inventory-transactions/types';
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

const INITIAL_VISIBLE = 20;

type Direction = 'in' | 'out' | 'flat';

function directionOf(quantityChanged: number): Direction {
  if (quantityChanged > 0) return 'in';
  if (quantityChanged < 0) return 'out';
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
  const {
    data: transactions = [],
    isLoading,
    isError,
    error,
  } = useInventoryTransactionsByMaterial(materialId);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [visible, setVisible] = useState(INITIAL_VISIBLE);

  const ordered = useMemo(() => {
    const q = search.toLowerCase();
    return [...transactions]
      .toSorted(
        (a, b) =>
          new Date(b.transactionDate).getTime() -
          new Date(a.transactionDate).getTime()
      )
      .filter((tx) => {
        const matchesSearch =
          !search ||
          (tx.referenceNumber ?? '').toLowerCase().includes(q) ||
          tx.storageLocationName.toLowerCase().includes(q) ||
          tx.projectName.toLowerCase().includes(q);
        const matchesType =
          typeFilter === 'all' || tx.transactionType === typeFilter;
        return matchesSearch && matchesType;
      });
  }, [transactions, search, typeFilter]);

  const hasActiveFilters = Boolean(search || typeFilter !== 'all');

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
  if (transactions.length === 0) {
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

  const shown = ordered.slice(0, visible);

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
            onChange={(e) => {
              setSearch(e.target.value);
              setVisible(INITIAL_VISIBLE);
            }}
            placeholder="Search by reference, location or project…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setVisible(INITIAL_VISIBLE);
          }}
        >
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
              setVisible(INITIAL_VISIBLE);
            }}
          >
            Clear
          </Button>
        )}
        <span className="ml-auto text-xs text-zinc-500">
          {ordered.length} movement{ordered.length === 1 ? '' : 's'}
        </span>
      </CardHeader>

      <CardContent className="p-0">
        {ordered.length === 0 ? (
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
          <>
            <ol className="relative px-4 py-4 sm:px-6">
              {/* Vertical rail */}
              <span
                aria-hidden
                className="absolute top-6 bottom-6 left-[1.35rem] w-px bg-zinc-200 sm:left-[2.1rem] dark:bg-zinc-800"
              />
              {shown.map((tx) => (
                <TimelineRow key={tx.id} tx={tx} unit={unit} />
              ))}
            </ol>

            {visible < ordered.length && (
              <div className="flex justify-center border-t px-4 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setVisible((v) => v + INITIAL_VISIBLE)
                  }
                >
                  Show more ({ordered.length - visible} remaining)
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Timeline row
// ---------------------------------------------------------------------------

function TimelineRow({
  tx,
  unit,
}: {
  tx: InventoryTransaction;
  unit: string;
}) {
  const direction = directionOf(tx.quantityChanged);
  const abs = Math.abs(tx.quantityChanged);

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
            className={inventoryTransactionTypeBadgeColors[tx.transactionType]}
          >
            {inventoryTransactionTypeLabels[tx.transactionType]}
          </Badge>
          <span className={`text-sm font-semibold tabular-nums ${qtyClass}`}>
            {sign}
            {abs.toLocaleString('en-IN')} {unit}
          </span>
          <span className="ml-auto text-xs whitespace-nowrap text-zinc-400 dark:text-zinc-500">
            {format(new Date(tx.transactionDate), 'MMM dd, yyyy · HH:mm')}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5 shrink-0" />
            {tx.storageLocationName}
          </span>
          {tx.projectName && (
            <span className="flex items-center gap-1">
              <FolderOpen className="size-3.5 shrink-0" />
              {tx.projectName}
            </span>
          )}
          {tx.referenceNumber && (
            <span className="flex items-center gap-1">
              <Hash className="size-3.5 shrink-0" />
              {tx.referenceNumber}
            </span>
          )}
        </div>

        <div className="mt-1 text-xs text-zinc-400 tabular-nums dark:text-zinc-500">
          Balance: {tx.openingStock.toLocaleString('en-IN')} →{' '}
          <span className="font-medium text-zinc-600 dark:text-zinc-300">
            {tx.closingStock.toLocaleString('en-IN')} {unit}
          </span>
          {tx.createdBy?.name ? <> · by {tx.createdBy.name}</> : null}
        </div>
      </div>
    </li>
  );
}
