'use client';

import { useMemo, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pagination, SearchAndFilter } from '@/components/common';
import {
  Loader2,
  WarehouseIcon,
  History,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowLeft,
  Minus,
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

  const [selectedLocation, setSelectedLocation] =
    useState<LocationStock | null>(null);
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [txDateFrom, setTxDateFrom] = useState('');
  const [txDateTo, setTxDateTo] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [txPerPage, setTxPerPage] = useState(10);

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
  const paginatedLocations = filteredLocations.slice(
    locStartIndex,
    locStartIndex + locPerPage
  );

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
  const paginatedTx = filteredTx.slice(txStartIndex, txStartIndex + txPerPage);
  const hasTxActiveFilters = Boolean(
    txSearch || txTypeFilter !== 'all' || txDateFrom || txDateTo
  );

  function openLocationHistory(ls: LocationStock) {
    setSelectedLocation(ls);
    setTxSearch('');
    setTxTypeFilter('all');
    setTxDateFrom('');
    setTxDateTo('');
    setTxPage(1);
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
        <CardContent className="py-12 text-center">
          <WarehouseIcon className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <p className="text-muted-foreground text-sm">
            No stock across any location.
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
              {materialStock.totalStock} {unit}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">Total Value</div>
            <div className="text-lg font-bold">
              ₹{materialStock.totalStockValue.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">Locations</div>
            <div className="text-lg font-bold">
              {materialStock.locationStock.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground text-xs">Empty Locations</div>
            <div className="text-lg font-bold text-zinc-400">
              {
                materialStock.locationStock.filter((ls) => ls.stock === 0)
                  .length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <SearchAndFilter
        variant="card"
        searchValue={locSearch}
        onSearchChange={(v) => {
          setLocSearch(v);
          setLocPage(1);
        }}
        searchPlaceholder="Search by project or location..."
        hasActiveFilters={!!locSearch}
        onClearFilters={() => {
          setLocSearch('');
          setLocPage(1);
        }}
      />

      {/* Results summary + rows-per-page */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {filteredLocations.length === 0 ? 0 : locStartIndex + 1} to{' '}
          {Math.min(locStartIndex + locPerPage, filteredLocations.length)} of{' '}
          {filteredLocations.length} locations
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Rows per page:
          </span>
          <Select
            value={locPerPage.toString()}
            onValueChange={(v) => {
              setLocPerPage(Number(v));
              setLocPage(1);
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
        <CardContent className="p-0">
          {filteredLocations.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">
                No locations match your search.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setLocSearch('');
                  setLocPage(1);
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
                      Project
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                      Storage Location
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
                      Track
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedLocations.map((ls) => {
                    const isEmpty = ls.stock === 0;
                    const isLow =
                      !isEmpty &&
                      reorderLevel !== undefined &&
                      ls.stock <= reorderLevel;
                    return (
                      <tr
                        key={`${ls.projectId}-${ls.storageLocationId}`}
                        className={`transition-colors ${
                          isEmpty
                            ? 'bg-zinc-50/50 dark:bg-zinc-900/20'
                            : 'hover:bg-accent/40'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{ls.projectName}</div>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                          {ls.storageLocationName}
                        </td>
                        <td className="px-4 py-3 text-right">
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
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-700 tabular-nums dark:text-zinc-300">
                          ₹{ls.stockValue.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <StockStatusBadge
                            stock={ls.stock}
                            reorderLevel={reorderLevel}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            onClick={() => openLocationHistory(ls)}
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {locTotalPages > 1 && (
          <Pagination
            currentPage={locPage}
            totalPages={locTotalPages}
            onPageChange={setLocPage}
          />
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

          <SearchAndFilter
            variant="card"
            searchValue={txSearch}
            onSearchChange={(v) => {
              setTxSearch(v);
              setTxPage(1);
            }}
            searchPlaceholder="Search by reference or project..."
            hasActiveFilters={hasTxActiveFilters}
            onClearFilters={clearTxFilters}
            filters={[
              {
                placeholder: 'All Types',
                options: TX_TYPE_OPTIONS,
                value: txTypeFilter,
                onChange: (v) => {
                  setTxTypeFilter(v);
                  setTxPage(1);
                },
              },
              {
                type: 'date',
                value: txDateFrom,
                onChange: (v) => {
                  setTxDateFrom(v);
                  setTxPage(1);
                },
              },
              {
                type: 'date',
                value: txDateTo,
                onChange: (v) => {
                  setTxDateTo(v);
                  setTxPage(1);
                },
              },
            ]}
          />

          {isLoadingTx ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : locationTransactions.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No transactions for this location.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Showing {filteredTx.length === 0 ? 0 : txStartIndex + 1} to{' '}
                  {Math.min(txStartIndex + txPerPage, filteredTx.length)} of{' '}
                  {filteredTx.length} transactions
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    Rows per page:
                  </span>
                  <Select
                    value={txPerPage.toString()}
                    onValueChange={(v) => {
                      setTxPerPage(Number(v));
                      setTxPage(1);
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
                <CardContent className="p-0">
                  {filteredTx.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground text-sm">
                        No transactions match your filters.
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={clearTxFilters}
                      >
                        Clear filters
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-zinc-50 dark:bg-zinc-900/40">
                            <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                              Type
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">
                              Opening
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">
                              Change
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">
                              Closing
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                              Reference
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                              By
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {paginatedTx.map((tx) => {
                            const isPositive = tx.quantityChanged > 0;
                            const isZero = tx.quantityChanged === 0;
                            const counterpart = getTransferCounterpart(
                              tx.transactionType,
                              tx.remarks
                            );
                            return (
                              <tr
                                key={tx.id}
                                className="hover:bg-accent/40 transition-colors"
                              >
                                <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
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
                                </td>
                                <td className="px-4 py-3">
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
                                </td>
                                <td className="text-muted-foreground px-4 py-3 text-right tabular-nums">
                                  {tx.openingStock}
                                </td>
                                <td className="px-4 py-3 text-right">
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
                                </td>
                                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                  {tx.closingStock}
                                </td>
                                <td className="px-4 py-3">
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
                                </td>
                                <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">
                                  {tx.createdBy.name}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
                {txTotalPages > 1 && (
                  <Pagination
                    currentPage={txPage}
                    totalPages={txTotalPages}
                    onPageChange={setTxPage}
                  />
                )}
              </Card>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
