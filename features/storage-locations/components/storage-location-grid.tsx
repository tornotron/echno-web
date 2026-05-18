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
import { Loader2, MapPin, Plus, Search } from 'lucide-react';
import { routes } from '@/nav';
import {
  STORAGE_LOCATION_TYPE_LABELS,
  type StorageLocation,
} from '@/types/storage-locations';
import { StorageLocationCard } from './storage-location-card';

interface StorageLocationGridProps {
  paginated: StorageLocation[];
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
  isLoading?: boolean;
}

export function StorageLocationGrid({
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
  isLoading,
}: StorageLocationGridProps) {
  const endIndex = Math.min(startIndex + itemsPerPage, filteredCount);

  const renderBody = () => {
    if (isLoading) {
      return (
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </CardContent>
      );
    }

    if (paginated.length > 0) {
      return (
        <>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginated.map((location) => (
                <StorageLocationCard key={location.id} location={location} />
              ))}
            </div>
          </CardContent>
          <div className="flex items-center justify-between border-t px-4 py-2">
            <span className="text-sm text-zinc-500">
              {filteredCount === 0 ? 0 : startIndex + 1}–{endIndex} of{' '}
              {filteredCount} location{filteredCount === 1 ? '' : 's'}
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
            <MapPin className="size-6" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No locations found</EmptyTitle>
            <EmptyDescription>
              {hasActiveFilters
                ? 'Try adjusting your filters or add a new location.'
                : 'Get started by adding your first storage location.'}
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link href={routes.resources.storageLocations.new}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Link>
          </Button>
        </Empty>
      </CardContent>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search locations…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(STORAGE_LOCATION_TYPE_LABELS).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2 border-l pl-3">
          <span className="text-xs whitespace-nowrap text-zinc-500">
            Per page
          </span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(v) => onItemsPerPageChange(Number(v))}
          >
            <SelectTrigger className="h-8 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[6, 9, 12, 18, 24].map((n) => (
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
