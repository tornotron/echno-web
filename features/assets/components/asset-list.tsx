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
import { Cog, Search } from 'lucide-react';
import { routes } from '@/nav';
import type { Asset } from '@/types/resource';
import { AssetListItem } from './asset-list-item';

interface SimpleLocation {
  id: number;
  locationName: string;
}

interface AssetListProps {
  paginated: Asset[];
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
  conditionFilter: string;
  onConditionChange: (v: string) => void;
  locationFilter: string;
  onLocationChange: (v: string) => void;
  locations: SimpleLocation[];
  maintenanceDueFilter: boolean;
  onMaintenanceDueChange: (v: boolean) => void;
}

export function AssetList({
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
  conditionFilter,
  onConditionChange,
  locationFilter,
  onLocationChange,
  locations,
  maintenanceDueFilter,
  onMaintenanceDueChange,
}: AssetListProps) {
  const endIndex = Math.min(startIndex + itemsPerPage, filteredCount);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, ID, manufacturer…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="heavy-equipment">Heavy Equipment</SelectItem>
            <SelectItem value="light-equipment">Light Equipment</SelectItem>
            <SelectItem value="vehicle">Vehicle</SelectItem>
            <SelectItem value="tool">Tool</SelectItem>
            <SelectItem value="machinery">Machinery</SelectItem>
            <SelectItem value="generator">Generator</SelectItem>
            <SelectItem value="computer">Computer & IT</SelectItem>
            <SelectItem value="furniture">Furniture</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="in-use">In Use</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="repair">Under Repair</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
            <SelectItem value="disposed">Disposed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={conditionFilter} onValueChange={onConditionChange}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            <SelectItem value="excellent">Excellent</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="fair">Fair</SelectItem>
            <SelectItem value="poor">Poor</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
          </SelectContent>
        </Select>
        <Select value={locationFilter} onValueChange={onLocationChange}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id.toString()}>
                {loc.locationName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={maintenanceDueFilter ? 'due' : 'all'}
          onValueChange={(v) => onMaintenanceDueChange(v === 'due')}
        >
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Maintenance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assets</SelectItem>
            <SelectItem value="due">Maintenance Due</SelectItem>
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
              {[5, 10, 20, 50, 100].map((n) => (
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
              {paginated.map((asset) => (
                <AssetListItem key={asset.id} asset={asset} />
              ))}
            </div>
          </CardContent>
          <div className="flex items-center justify-between border-t px-4 py-2">
            <span className="text-sm text-zinc-500">
              {startIndex + 1}–{endIndex} of {filteredCount} asset
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
          <Empty variant="default">
            <EmptyMedia variant="icon">
              <Cog className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No assets found</EmptyTitle>
              <EmptyDescription>
                {hasActiveFilters
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by registering your first asset.'}
              </EmptyDescription>
            </EmptyHeader>
            {!hasActiveFilters && (
              <Button asChild>
                <Link href={routes.resources.assets.new}>
                  <Cog className="mr-2 h-4 w-4" />
                  Register Asset
                </Link>
              </Button>
            )}
          </Empty>
        </CardContent>
      )}
    </Card>
  );
}
