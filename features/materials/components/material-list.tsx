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
import { Loader2, Package, Plus, Search } from 'lucide-react';
import { routes } from '@/nav';
import type { Material } from '@/types/materials';
import { MaterialListItem } from './material-list-item';

interface UnitOption {
  value: string;
  label: string;
}

interface MaterialListProps {
  paginated: Material[];
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
  unitFilter: string;
  onUnitChange: (v: string) => void;
  unitFilterOptions: UnitOption[];
  isLoading?: boolean;
  isError?: boolean;
}

export function MaterialList({
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
  unitFilter,
  onUnitChange,
  unitFilterOptions,
  isLoading,
  isError,
}: MaterialListProps) {
  const endIndex = Math.min(startIndex + itemsPerPage, filteredCount);

  const renderBody = () => {
    if (isLoading) {
      return (
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </CardContent>
      );
    }

    if (isError) {
      return (
        <CardContent className="py-12 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h3 className="mb-2 text-lg font-medium">Failed to load materials</h3>
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred.
          </p>
        </CardContent>
      );
    }

    if (paginated.length > 0) {
      return (
        <>
          <CardContent className="p-6">
            <div className="space-y-4">
              {paginated.map((material) => (
                <MaterialListItem key={material.id} material={material} />
              ))}
            </div>
          </CardContent>
          <div className="flex items-center justify-between border-t px-4 py-2">
            <span className="text-sm text-zinc-500">
              {startIndex + 1}–{endIndex} of {filteredCount} material
              {filteredCount === 1 ? '' : 's'}
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </>
      );
    }

    return (
      <CardContent>
        <Empty variant="default">
          <EmptyMedia variant="icon">
            <Package className="size-6" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No materials found</EmptyTitle>
            <EmptyDescription>
              {hasActiveFilters
                ? 'Try adjusting your search or filters.'
                : 'Get started by adding your first material.'}
            </EmptyDescription>
          </EmptyHeader>
          {!hasActiveFilters && (
            <Button asChild>
              <Link href={routes.resources.materials.new}>
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Link>
            </Button>
          )}
        </Empty>
      </CardContent>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-1">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or SKU…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={unitFilter} onValueChange={onUnitChange}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Unit" />
          </SelectTrigger>
          <SelectContent>
            {unitFilterOptions.map((o) => (
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
            onValueChange={(v) => onItemsPerPageChange(Number(v))}
          >
            <SelectTrigger className="h-8 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      {renderBody()}
    </Card>
  );
}
