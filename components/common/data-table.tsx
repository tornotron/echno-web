'use client';

import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pagination } from '@/components/common/pagination';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Search, Loader2 } from 'lucide-react';
import {
  Empty,
  EmptyErrorMedia,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';

export type DataTableRowId = string | number;

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  headClassName?: string;
}

export interface DataTableFilterOption {
  value: string;
  label: string;
}

export interface DataTableFilter<T> {
  id: string;
  placeholder: string;
  options: DataTableFilterOption[];
  predicate: (row: T, value: string) => boolean;
}

/**
 * Server-side control surface. When provided, the table switches to "manual"
 * mode: it renders `data` as the current page verbatim (no client-side search,
 * filter, or slicing) and delegates every control to these callbacks. The
 * search box and filter selects become controlled by `searchValue` /
 * `filterValues`; paging is driven by `page` / `totalItems` / `totalPages`.
 * Leave undefined for the default client-side behavior.
 */
export interface DataTableManualControls {
  /** 1-based current page. */
  page: number;
  /** Current page size. */
  pageSize: number;
  /** Total rows across all pages (for the count label). */
  totalItems: number;
  /** Total number of pages. */
  totalPages: number;
  /** True while a page/filter change is in flight (dims the current page). */
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** Current search text (controlled). */
  searchValue: string;
  onSearchChange: (query: string) => void;
  /** Current filter selections by filter id (controlled). */
  filterValues: Record<string, string>;
  onFilterChange: (id: string, value: string) => void;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => DataTableRowId;
  isLoading?: boolean;
  isError?: boolean;
  searchPlaceholder?: string;
  searchPredicate?: (row: T, query: string) => boolean;
  filters?: DataTableFilter<T>[];
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  enableSelection?: boolean;
  onSelectionChange?: (ids: DataTableRowId[]) => void;
  onRowClick?: (row: T) => void;
  errorIcon?: ReactNode;
  errorTitle?: string;
  errorDescription?: string;
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;
  entityNoun?: { one: string; many: string };
  /**
   * Server-side pagination controls. When present, the table renders `data`
   * as-is and defers search/filter/paging to the caller; when absent, the
   * table filters, searches, and paginates `data` client-side (default).
   * In manual mode `searchPredicate` / `filter.predicate` are unused (their
   * `placeholder` / `options` still drive the UI), so pass no-op predicates.
   */
  manual?: DataTableManualControls;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

export function DataTable<T>({
  data,
  columns,
  getRowId,
  isLoading = false,
  isError = false,
  searchPlaceholder = 'Search...',
  searchPredicate,
  filters = [],
  defaultPageSize = 10,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  enableSelection = false,
  onSelectionChange,
  onRowClick,
  errorIcon,
  errorTitle = 'Failed to load data',
  errorDescription = 'An unexpected error occurred. Please try again.',
  emptyIcon,
  emptyTitle = 'No records found',
  emptyDescription = 'There is nothing to show yet.',
  emptyAction,
  entityNoun = { one: 'record', many: 'records' },
  manual,
}: DataTableProps<T>) {
  const isManual = manual !== undefined;

  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [internalFilterValues, setInternalFilterValues] = useState<
    Record<string, string>
  >({});
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(defaultPageSize);
  const [selectedIds, setSelectedIds] = useState<DataTableRowId[]>([]);

  // In manual mode every control is owned by the caller; otherwise the table
  // keeps its own client-side search / filter / paging state.
  const searchQuery = isManual ? manual.searchValue : internalSearchQuery;
  const setSearchQuery = isManual
    ? manual.onSearchChange
    : setInternalSearchQuery;
  const filterValues = isManual ? manual.filterValues : internalFilterValues;
  const currentPage = isManual ? manual.page : internalPage;
  const itemsPerPage = isManual ? manual.pageSize : internalPageSize;

  const setCurrentPage = (page: number) => {
    if (isManual) manual.onPageChange(page);
    else setInternalPage(page);
  };
  const setItemsPerPage = (size: number) => {
    if (isManual) manual.onPageSizeChange(size);
    else setInternalPageSize(size);
  };
  const setFilterValue = (id: string, value: string) => {
    if (isManual) manual.onFilterChange(id, value);
    else setInternalFilterValues((previous) => ({ ...previous, [id]: value }));
  };

  const filterValueFor = (id: string) => filterValues[id] ?? 'all';

  const filteredData = useMemo(() => {
    if (isManual) return data;
    return data.filter((row) => {
      const matchesSearch =
        !searchQuery || !searchPredicate || searchPredicate(row, searchQuery);

      const matchesFilters = filters.every((filter) => {
        const value = filterValues[filter.id] ?? 'all';
        return value === 'all' || filter.predicate(row, value);
      });

      return matchesSearch && matchesFilters;
    });
  }, [isManual, data, searchQuery, searchPredicate, filters, filterValues]);

  // In manual mode paging metadata comes from the server and `data` is already
  // the current page; client-side it is derived from the filtered set.
  const totalItems = isManual ? manual.totalItems : filteredData.length;
  const totalPages = isManual
    ? manual.totalPages
    : Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = isManual
    ? data
    : filteredData.slice(startIndex, endIndex);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));

  useEffect(() => {
    onSelectionChange?.(selectedIds);
  }, [selectedIds, onSelectionChange]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? paginatedData.map((row) => getRowId(row)) : []);
  };

  const handleSelectOne = (id: DataTableRowId, checked: boolean) => {
    setSelectedIds((previous) =>
      checked ? [...previous, id] : previous.filter((value) => value !== id)
    );
  };

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedIds.includes(getRowId(row)));

  const hasActiveFilters = Boolean(
    searchQuery || filters.some((filter) => filterValueFor(filter.id) !== 'all')
  );

  const columnCount = columns.length + (enableSelection ? 1 : 0);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
        {searchPredicate && (
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="h-8 pl-8 text-sm"
            />
          </div>
        )}
        {filters.map((filter) => (
          <Select
            key={filter.id}
            value={filterValueFor(filter.id)}
            onValueChange={(v) => {
              setFilterValue(filter.id, v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        <div className="ml-auto flex items-center gap-2 border-l pl-3">
          <span className="text-xs whitespace-nowrap text-zinc-500">
            Rows per page
          </span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(v) => {
              setItemsPerPage(Number(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {(() => {
          if (isLoading)
            return (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              </div>
            );
          if (isError)
            return (
              <CardContent>
                <Empty variant="default">
                  <EmptyErrorMedia>{errorIcon}</EmptyErrorMedia>
                  <EmptyHeader>
                    <EmptyTitle>{errorTitle}</EmptyTitle>
                    <EmptyDescription>{errorDescription}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            );
          if (paginatedData.length > 0)
            return (
              <div
                aria-busy={manual?.isFetching ? true : undefined}
                className={
                  manual?.isFetching
                    ? 'pointer-events-none opacity-60 transition-opacity'
                    : 'transition-opacity'
                }
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      {enableSelection && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={(checked) =>
                              handleSelectAll(checked as boolean)
                            }
                            aria-label="Select all"
                          />
                        </TableHead>
                      )}
                      {columns.map((column) => (
                        <TableHead
                          key={column.id}
                          className={column.headClassName}
                        >
                          {column.header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row) => {
                      const rowId = getRowId(row);
                      return (
                        <TableRow
                          key={rowId}
                          role={onRowClick ? 'button' : undefined}
                          tabIndex={onRowClick ? 0 : undefined}
                          className={
                            onRowClick
                              ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                              : undefined
                          }
                          onClick={
                            onRowClick ? () => onRowClick(row) : undefined
                          }
                          onKeyDown={
                            onRowClick
                              ? (e) => {
                                  if (e.key === ' ') {
                                    e.preventDefault();
                                    onRowClick(row);
                                  } else if (e.key === 'Enter') {
                                    onRowClick(row);
                                  }
                                }
                              : undefined
                          }
                        >
                          {enableSelection && (
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.includes(rowId)}
                                onCheckedChange={(checked) =>
                                  handleSelectOne(rowId, checked as boolean)
                                }
                                aria-label="Select row"
                              />
                            </TableCell>
                          )}
                          {columns.map((column) => (
                            <Fragment key={column.id}>
                              {column.cell(row)}
                            </Fragment>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          return (
            <CardContent>
              <Empty variant="default">
                <EmptyMedia variant="icon">{emptyIcon}</EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>{emptyTitle}</EmptyTitle>
                  <EmptyDescription>
                    {hasActiveFilters
                      ? 'Try adjusting your search or filters.'
                      : emptyDescription}
                  </EmptyDescription>
                </EmptyHeader>
                {!hasActiveFilters && emptyAction}
              </Empty>
            </CardContent>
          );
        })()}
      </CardContent>

      <div className="flex items-center justify-between border-t px-4 py-2">
        <span className="text-sm text-zinc-500">
          {totalItems === 0
            ? `0 ${entityNoun.many}`
            : `${startIndex + 1}–${Math.min(endIndex, totalItems)} of ${totalItems} ${totalItems === 1 ? entityNoun.one : entityNoun.many}`}
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
