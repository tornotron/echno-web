'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pagination } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Input } from '@/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  Empty,
  EmptyErrorMedia,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { HardHat, Loader2, Search } from 'lucide-react';
import { routes } from '@/nav';
import type { Labour } from '@tornotron/echno-core/labour/types';
import { LabourRow } from './labour-row';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

interface LabourTableProps {
  paginated: Labour[];
  filteredCount: number;
  startIndex: number;
  itemsPerPage: number;
  onItemsPerPageChange: (n: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  hasActiveFilters: boolean;
  isLoading: boolean;
  isError: boolean;
  searchValue: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  typeFilter: string;
  onTypeChange: (v: string) => void;
  projectFilter: string;
  onProjectChange: (v: string) => void;
  projectOptions: string[];
}

export function LabourTable({
  paginated,
  filteredCount,
  startIndex,
  itemsPerPage,
  onItemsPerPageChange,
  currentPage,
  totalPages,
  onPageChange,
  hasActiveFilters,
  isLoading,
  isError,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  projectFilter,
  onProjectChange,
  projectOptions,
}: LabourTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const endIndex = Math.min(startIndex + itemsPerPage, filteredCount);
  const isAllSelected =
    paginated.length > 0 && paginated.every((l) => selectedIds.includes(l.id));
  const isSomeSelected =
    paginated.some((l) => selectedIds.includes(l.id)) && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginated.map((l) => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-1">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, ID, or specialization..."
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="ON_LEAVE">On Leave</SelectItem>
            <SelectItem value="TERMINATED">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={onTypeChange}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="DAILY_WAGE">Daily Wage</SelectItem>
            <SelectItem value="MONTHLY">Monthly</SelectItem>
            <SelectItem value="CONTRACT">Contract</SelectItem>
            <SelectItem value="PIECE_RATE">Piece Rate</SelectItem>
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={onProjectChange}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projectOptions.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
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
              {PAGE_SIZE_OPTIONS.map((n) => (
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
                  <EmptyErrorMedia>
                    <HardHat className="size-6" />
                  </EmptyErrorMedia>
                  <EmptyHeader>
                    <EmptyTitle>Failed to load labour records</EmptyTitle>
                    <EmptyDescription>
                      An unexpected error occurred. Please try again.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            );
          if (paginated.length > 0)
            return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                        className={
                          isSomeSelected
                            ? 'data-[state=checked]:bg-primary/50'
                            : ''
                        }
                      />
                    </TableHead>
                    <TableHead>Name & Contact</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((labour) => (
                    <LabourRow
                      key={labour.id}
                      labour={labour}
                      onClick={() =>
                        router.push(
                          routes.thirdParty.labour.detail(labour.id).href
                        )
                      }
                      isSelected={selectedIds.includes(labour.id)}
                      onSelect={(checked) =>
                        handleSelectOne(labour.id, checked)
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            );
          return (
            <CardContent>
              <Empty variant="default">
                <EmptyMedia variant="icon">
                  <HardHat className="size-6" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No labour records found</EmptyTitle>
                  <EmptyDescription>
                    {hasActiveFilters
                      ? 'Try adjusting your search or filters.'
                      : 'Add your first labour record to get started.'}
                  </EmptyDescription>
                </EmptyHeader>
                {!hasActiveFilters && (
                  <Button asChild>
                    <Link href={routes.thirdParty.labour.new}>Add Labour</Link>
                  </Button>
                )}
              </Empty>
            </CardContent>
          );
        })()}
      </CardContent>

      <div className="flex items-center justify-between border-t px-4 py-2">
        <span className="text-sm text-zinc-500">
          {filteredCount === 0
            ? '0 records'
            : `${startIndex + 1}–${endIndex} of ${filteredCount} record${filteredCount === 1 ? '' : 's'}`}
        </span>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </Card>
  );
}
