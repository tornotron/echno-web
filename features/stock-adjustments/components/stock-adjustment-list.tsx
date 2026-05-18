'use client';

import Link from 'next/link';
import { Pagination } from '@/components/common';
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
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { Plus, Search, Settings } from 'lucide-react';
import { routes } from '@/nav';
import type { StockAdjustment } from '@/types/resource';
import { StockAdjustmentListItem } from './stock-adjustment-list-item';

interface StockAdjustmentListProps {
  paginated: StockAdjustment[];
  filteredCount: number;
  startIndex: number;
  itemsPerPage: number;
  onItemsPerPageChange: (n: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  searchValue: string;
  onSearchChange: (v: string) => void;
  typeFilter: string;
  onTypeChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  reasonFilter: string;
  onReasonChange: (v: string) => void;
  onClearFilters: () => void;
}

export function StockAdjustmentList({
  paginated,
  filteredCount,
  startIndex,
  itemsPerPage,
  onItemsPerPageChange,
  currentPage,
  totalPages,
  onPageChange,
  hasActiveFilters,
  searchValue,
  onSearchChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  reasonFilter,
  onReasonChange,
  onClearFilters,
}: StockAdjustmentListProps) {
  const endIndex = Math.min(startIndex + itemsPerPage, filteredCount);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by adjustment ID, material…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="correction">Correction</SelectItem>
            <SelectItem value="write-off">Write-off</SelectItem>
            <SelectItem value="found">Found Items</SelectItem>
            <SelectItem value="return">Return</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={reasonFilter} onValueChange={onReasonChange}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reasons</SelectItem>
            <SelectItem value="stock-discrepancy">Stock Discrepancy</SelectItem>
            <SelectItem value="damage">Damage</SelectItem>
            <SelectItem value="expiry">Expiry</SelectItem>
            <SelectItem value="theft">Theft</SelectItem>
            <SelectItem value="found-items">Found Items</SelectItem>
            <SelectItem value="counting-error">Counting Error</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2 border-l pl-3">
          <span className="text-xs whitespace-nowrap text-zinc-500">
            Rows per page
          </span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(v) => onItemsPerPageChange(Number(v))}
          >
            <SelectTrigger className="h-8 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      {paginated.length > 0 ? (
        <>
          <CardContent className="p-6">
            <div className="space-y-4">
              {paginated.map((adj) => (
                <StockAdjustmentListItem key={adj.id} adjustment={adj} />
              ))}
            </div>
          </CardContent>
          <div className="flex items-center justify-between border-t px-4 py-2">
            <span className="text-sm text-zinc-500">
              {startIndex + 1}–{endIndex} of {filteredCount} adjustment
              {filteredCount === 1 ? '' : 's'}
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </>
      ) : (
        <CardContent>
          <Empty variant="inline">
            <EmptyMedia variant="icon">
              <Settings className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {hasActiveFilters
                  ? 'No stock adjustments found'
                  : 'No stock adjustments yet'}
              </EmptyTitle>
              <EmptyDescription>
                {hasActiveFilters
                  ? "Try adjusting your filters to find what you're looking for."
                  : 'Create your first stock adjustment to get started.'}
              </EmptyDescription>
            </EmptyHeader>
            {hasActiveFilters ? (
              <Button onClick={onClearFilters} variant="outline">
                Clear Filters
              </Button>
            ) : (
              <Button asChild>
                <Link href={routes.resources.stockAdjustments.new}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Adjustment
                </Link>
              </Button>
            )}
          </Empty>
        </CardContent>
      )}
    </Card>
  );
}
