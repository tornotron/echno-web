'use client';

import { useMemo, useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import {
  Loader2,
  WarehouseIcon,
  History,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowLeft,
  Minus,
  Search,
  BarChart3,
  Layers,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  useMaterialStock,
  useInventoryTransactionsByStorageLocationAndMaterial,
} from '@/hooks/inventory-transactions/use-inventory-transactions';
import {
  InventoryTransactionType,
  inventoryTransactionTypeLabels,
  inventoryTransactionTypeBadgeColors,
} from '@/types/inventory-transactions';
import type { LocationStock } from '@/types/inventory-transactions';

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

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

function getTransferCounterpart(
  type: InventoryTransactionType,
  remarks?: string
): string | null {
  if (type === InventoryTransactionType.transferOut) {
    const match = remarks?.match(/transfer out to (.+?) by /i);
    return match ? match[1] : null;
  }
  if (type === InventoryTransactionType.transferIn) {
    const match = remarks?.match(/transfer in from (.+?) by /i);
    return match ? match[1] : null;
  }
  return null;
}

function StockStatusBadge({
  stock,
  reorderLevel,
}: {
  stock: number;
  reorderLevel?: number;
}) {
  if (stock === 0) {
    return (
      <Badge className="bg-zinc-100 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        Empty
      </Badge>
    );
  }
  if (reorderLevel !== undefined && stock <= reorderLevel) {
    return (
      <Badge className="bg-amber-100 text-xs text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
        Low
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
// Props
// ---------------------------------------------------------------------------

interface MaterialStockByLocationTabProps {
  materialId: number;
  unit: string;
  reorderLevel?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MaterialStockByLocationTab({
  materialId,
  unit,
  reorderLevel,
}: MaterialStockByLocationTabProps) {
  const { data: materialStock, isLoading } = useMaterialStock(materialId);

  const [locSearch, setLocSearch] = useState('');
  const [locPage, setLocPage] = useState(1);
  const [locPerPage, setLocPerPage] = useState(10);
  const [locSelectedIds, setLocSelectedIds] = useState<string[]>([]);

  const [selectedLocation, setSelectedLocation] =
    useState<LocationStock | null>(null);
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [txDateFrom, setTxDateFrom] = useState('');
  const [txDateTo, setTxDateTo] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [txPerPage, setTxPerPage] = useState(10);
  const [txSelectedIds, setTxSelectedIds] = useState<number[]>([]);

  // ── Locations filtering / pagination ──────────────────────────────────────

  const filteredLocations = useMemo(() => {
    const q = locSearch.toLowerCase();
    return (materialStock?.locationStock ?? []).filter(
      (ls) =>
        !locSearch ||
        ls.projectName.toLowerCase().includes(q) ||
        ls.storageLocationName.toLowerCase().includes(q)
    );
  }, [materialStock, locSearch]);

  const locTotalPages = Math.ceil(filteredLocations.length / locPerPage);
  const locStartIndex = (locPage - 1) * locPerPage;
  const locEndIndex = Math.min(
    locStartIndex + locPerPage,
    filteredLocations.length
  );
  const paginatedLocations = filteredLocations.slice(
    locStartIndex,
    locStartIndex + locPerPage
  );

  const locRowKey = (ls: LocationStock) =>
    `${ls.projectId}-${ls.storageLocationId}`;

  const isAllLocSelected =
    paginatedLocations.length > 0 &&
    paginatedLocations.every((ls) => locSelectedIds.includes(locRowKey(ls)));
  const isSomeLocSelected =
    !isAllLocSelected &&
    paginatedLocations.some((ls) => locSelectedIds.includes(locRowKey(ls)));

  const handleLocSelectAll = (checked: boolean) => {
    setLocSelectedIds(
      checked ? paginatedLocations.map((ls) => locRowKey(ls)) : []
    );
  };
  const handleLocSelectOne = (key: string, checked: boolean) => {
    setLocSelectedIds((prev) =>
      checked ? [...prev, key] : prev.filter((x) => x !== key)
    );
  };

  // ── Transaction history ────────────────────────────────────────────────────

  const { data: locationTransactions = [], isLoading: isLoadingTx } =
    useInventoryTransactionsByStorageLocationAndMaterial(
      selectedLocation?.storageLocationId ?? 0,
      materialId,
      selectedLocation?.projectId ?? 0
    );

  const filteredTx = useMemo(() => {
    const q = txSearch.toLowerCase();
    return locationTransactions.filter((tx) => {
      const matchesSearch =
        !txSearch ||
        (tx.referenceNumber ?? '').toLowerCase().includes(q) ||
        tx.projectName.toLowerCase().includes(q);
      const matchesType =
        txTypeFilter === 'all' || tx.transactionType === txTypeFilter;
      const txDate = new Date(tx.transactionDate);
      const matchesFrom = !txDateFrom || txDate >= new Date(txDateFrom);
      const matchesTo = !txDateTo || txDate <= new Date(txDateTo + 'T23:59:59');
      return matchesSearch && matchesType && matchesFrom && matchesTo;
    });
  }, [locationTransactions, txSearch, txTypeFilter, txDateFrom, txDateTo]);

  const txTotalPages = Math.ceil(filteredTx.length / txPerPage);
  const txStartIndex = (txPage - 1) * txPerPage;
  const txEndIndex = Math.min(txStartIndex + txPerPage, filteredTx.length);
  const paginatedTx = filteredTx.slice(txStartIndex, txStartIndex + txPerPage);
  const hasTxActiveFilters = Boolean(
    txSearch || txTypeFilter !== 'all' || txDateFrom || txDateTo
  );

  const isAllTxSelected =
    paginatedTx.length > 0 &&
    paginatedTx.every((tx) => txSelectedIds.includes(tx.id));
  const isSomeTxSelected =
    !isAllTxSelected && paginatedTx.some((tx) => txSelectedIds.includes(tx.id));

  const handleTxSelectAll = (checked: boolean) => {
    setTxSelectedIds(checked ? paginatedTx.map((tx) => tx.id) : []);
  };
  const handleTxSelectOne = (id: number, checked: boolean) => {
    setTxSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  function openLocationHistory(ls: LocationStock) {
    setSelectedLocation(ls);
    setTxSearch('');
    setTxTypeFilter('all');
    setTxDateFrom('');
    setTxDateTo('');
    setTxPage(1);
    setTxSelectedIds([]);
  }

  function clearTxFilters() {
    setTxSearch('');
    setTxTypeFilter('all');
    setTxDateFrom('');
    setTxDateTo('');
    setTxPage(1);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!materialStock || materialStock.locationStock.length === 0) {
    return (
      <Card>
        <CardContent>
          <Empty variant="default">
            <EmptyMedia variant="icon">
              <WarehouseIcon className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No stock found</EmptyTitle>
              <EmptyDescription>No stock across any location.</EmptyDescription>
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
                {materialStock.totalStock.toLocaleString()} {unit}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <WarehouseIcon className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              across all locations
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Value
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                ₹{materialStock.totalStockValue.toLocaleString('en-IN')}
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
              Locations
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {materialStock.locationStock.length}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <Layers className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              active locations
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Empty Locations
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-400 dark:text-zinc-500">
                {
                  materialStock.locationStock.filter((ls) => ls.stock === 0)
                    .length
                }
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <WarehouseIcon className="size-4 text-zinc-400 dark:text-zinc-500" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              no stock held
            </p>
          </div>
        </div>
      </Card>

      {/* Location table */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={locSearch}
              onChange={(e) => {
                setLocSearch(e.target.value);
                setLocPage(1);
              }}
              placeholder="Search by project or location…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <div className="ml-auto flex items-center gap-2 border-l pl-3">
            <span className="text-xs whitespace-nowrap text-zinc-500">
              Rows per page
            </span>
            <Select
              value={String(locPerPage)}
              onValueChange={(v) => {
                setLocPerPage(Number(v));
                setLocPage(1);
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

        {paginatedLocations.length > 0 ? (
          <>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 pl-5">
                      <Checkbox
                        checked={
                          isSomeLocSelected ? 'indeterminate' : isAllLocSelected
                        }
                        onCheckedChange={handleLocSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Storage Location</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Stock Value</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="pr-6 text-right">History</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLocations.map((ls) => {
                    const key = locRowKey(ls);
                    const isEmpty = ls.stock === 0;
                    const isLow =
                      !isEmpty &&
                      reorderLevel !== undefined &&
                      ls.stock <= reorderLevel;
                    return (
                      <TableRow key={key}>
                        <TableCell
                          className="pl-5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={locSelectedIds.includes(key)}
                            onCheckedChange={(checked) =>
                              handleLocSelectOne(key, checked as boolean)
                            }
                            aria-label={`Select ${ls.storageLocationName}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {ls.projectName}
                        </TableCell>
                        <TableCell className="text-zinc-600 dark:text-zinc-400">
                          {ls.storageLocationName}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-semibold tabular-nums ${
                              isEmpty
                                ? 'text-zinc-400'
                                : isLow
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : ''
                            }`}
                          >
                            {ls.stock} {unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-zinc-700 tabular-nums dark:text-zinc-300">
                          ₹{ls.stockValue.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <StockStatusBadge
                            stock={ls.stock}
                            reorderLevel={reorderLevel}
                          />
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            onClick={() => openLocationHistory(ls)}
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
            <div className="flex items-center justify-between border-t px-4 py-2">
              <span className="text-sm text-zinc-500">
                {filteredLocations.length === 0 ? 0 : locStartIndex + 1}–
                {locEndIndex} of {filteredLocations.length} location
                {filteredLocations.length === 1 ? '' : 's'}
              </span>
              <Pagination
                currentPage={locPage}
                totalPages={locTotalPages}
                onPageChange={setLocPage}
              />
            </div>
          </>
        ) : (
          <CardContent>
            <Empty variant="default">
              <EmptyMedia variant="icon">
                <WarehouseIcon className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No locations match your search</EmptyTitle>
                <EmptyDescription>
                  Try adjusting your search terms.
                </EmptyDescription>
              </EmptyHeader>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLocSearch('');
                  setLocPage(1);
                }}
              >
                Clear search
              </Button>
            </Empty>
          </CardContent>
        )}
      </Card>

      {/* ── Stock History Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={!!selectedLocation}
        onOpenChange={(open) => {
          if (!open) setSelectedLocation(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Stock History
            </DialogTitle>
          </DialogHeader>

          {/* Location context strip */}
          {selectedLocation && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-zinc-50 px-4 py-3 dark:bg-zinc-900/40">
              <div>
                <div className="text-xs text-zinc-500">Location</div>
                <div className="font-medium">
                  {selectedLocation.storageLocationName}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Project</div>
                <div className="font-medium">
                  {selectedLocation.projectName}
                </div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-xs text-zinc-500">Current Stock</div>
                <div className="font-semibold">
                  {selectedLocation.stock} {unit}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500">Stock Value</div>
                <div className="font-semibold">
                  ₹{selectedLocation.stockValue.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          )}

          {isLoadingTx ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : locationTransactions.length === 0 ? (
            <Card>
              <CardContent>
                <Empty variant="default">
                  <EmptyMedia variant="icon">
                    <History className="size-6" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>No transactions</EmptyTitle>
                    <EmptyDescription>
                      No transactions for this location.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
                <div className="relative w-full max-w-xs">
                  <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
                  <Input
                    value={txSearch}
                    onChange={(e) => {
                      setTxSearch(e.target.value);
                      setTxPage(1);
                    }}
                    placeholder="Search by reference or project…"
                    className="h-8 pl-8 text-sm"
                  />
                </div>
                <Select
                  value={txTypeFilter}
                  onValueChange={(v) => {
                    setTxTypeFilter(v);
                    setTxPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-36 text-xs">
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
                <Input
                  type="date"
                  value={txDateFrom}
                  onChange={(e) => {
                    setTxDateFrom(e.target.value);
                    setTxPage(1);
                  }}
                  className="h-8 w-36 text-xs"
                />
                <Input
                  type="date"
                  value={txDateTo}
                  onChange={(e) => {
                    setTxDateTo(e.target.value);
                    setTxPage(1);
                  }}
                  className="h-8 w-36 text-xs"
                />
                {hasTxActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={clearTxFilters}
                  >
                    Clear
                  </Button>
                )}
                <div className="ml-auto flex items-center gap-2 border-l pl-3">
                  <span className="text-xs whitespace-nowrap text-zinc-500">
                    Rows per page
                  </span>
                  <Select
                    value={String(txPerPage)}
                    onValueChange={(v) => {
                      setTxPerPage(Number(v));
                      setTxPage(1);
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

              {paginatedTx.length > 0 ? (
                <>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 pl-5">
                            <Checkbox
                              checked={
                                isSomeTxSelected
                                  ? 'indeterminate'
                                  : isAllTxSelected
                              }
                              onCheckedChange={handleTxSelectAll}
                              aria-label="Select all"
                            />
                          </TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Opening</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                          <TableHead className="text-right">Closing</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead className="pr-6">By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedTx.map((tx) => {
                          const isPositive = tx.quantityChanged > 0;
                          const isZero = tx.quantityChanged === 0;
                          const counterpart = getTransferCounterpart(
                            tx.transactionType,
                            tx.remarks
                          );
                          return (
                            <TableRow key={tx.id}>
                              <TableCell
                                className="pl-5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Checkbox
                                  checked={txSelectedIds.includes(tx.id)}
                                  onCheckedChange={(checked) =>
                                    handleTxSelectOne(tx.id, checked as boolean)
                                  }
                                  aria-label={`Select transaction ${tx.id}`}
                                />
                              </TableCell>
                              <TableCell className="text-muted-foreground whitespace-nowrap">
                                {format(
                                  new Date(tx.transactionDate),
                                  'MMM dd, yyyy'
                                )}
                                <div className="text-xs">
                                  {format(
                                    new Date(tx.transactionDate),
                                    'HH:mm'
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    inventoryTransactionTypeBadgeColors[
                                      tx.transactionType
                                    ]
                                  }
                                >
                                  {
                                    inventoryTransactionTypeLabels[
                                      tx.transactionType
                                    ]
                                  }
                                </Badge>
                                {counterpart && (
                                  <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                                    {tx.transactionType ===
                                    InventoryTransactionType.transferOut ? (
                                      <ArrowRight className="h-3 w-3" />
                                    ) : (
                                      <ArrowLeft className="h-3 w-3" />
                                    )}
                                    {counterpart}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-right tabular-nums">
                                {tx.openingStock}
                              </TableCell>
                              <TableCell className="text-right">
                                <div
                                  className={`flex items-center justify-end gap-1 font-semibold tabular-nums ${
                                    isZero
                                      ? 'text-muted-foreground'
                                      : isPositive
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                  }`}
                                >
                                  {isZero ? (
                                    <Minus className="h-3.5 w-3.5" />
                                  ) : isPositive ? (
                                    <TrendingUp className="h-3.5 w-3.5" />
                                  ) : (
                                    <TrendingDown className="h-3.5 w-3.5" />
                                  )}
                                  {isPositive
                                    ? `+${tx.quantityChanged}`
                                    : tx.quantityChanged}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold tabular-nums">
                                {tx.closingStock}
                              </TableCell>
                              <TableCell>
                                <div className="text-muted-foreground">
                                  {tx.referenceNumber ?? '—'}
                                </div>
                                {tx.remarks && (
                                  <div
                                    className="text-muted-foreground max-w-[180px] truncate text-xs"
                                    title={tx.remarks}
                                  >
                                    {tx.remarks}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground pr-6 whitespace-nowrap">
                                {tx.createdBy.name}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <div className="flex items-center justify-between border-t px-4 py-2">
                    <span className="text-sm text-zinc-500">
                      {filteredTx.length === 0 ? 0 : txStartIndex + 1}–
                      {txEndIndex} of {filteredTx.length} transaction
                      {filteredTx.length === 1 ? '' : 's'}
                    </span>
                    <Pagination
                      currentPage={txPage}
                      totalPages={txTotalPages}
                      onPageChange={setTxPage}
                    />
                  </div>
                </>
              ) : (
                <CardContent>
                  <Empty variant="default">
                    <EmptyMedia variant="icon">
                      <History className="size-6" />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>
                        No transactions match your filters
                      </EmptyTitle>
                      <EmptyDescription>
                        Try adjusting your search or filters.
                      </EmptyDescription>
                    </EmptyHeader>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearTxFilters}
                    >
                      Clear filters
                    </Button>
                  </Empty>
                </CardContent>
              )}
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
