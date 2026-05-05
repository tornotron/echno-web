'use client';

import { useState, useMemo } from 'react';
import { Search, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
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
import { Input } from '@/components/shadcn/input';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Progress } from '@/components/shadcn/progress';
import { Loader2 } from 'lucide-react';
import { LeaveBalance } from '@/types/leave';

interface BalancesTabContentProps {
  balanceSummary:
    | {
        balances: LeaveBalance[];
        totalAvailable: number;
        totalUsed: number;
        totalPending: number;
      }
    | undefined;
  isLoading: boolean;
  selectedYear: string;
  years: string[];
  onYearChange: (year: string) => void;
}

export function BalancesTabContent({
  balanceSummary,
  isLoading,
  selectedYear,
  years,
  onYearChange,
}: BalancesTabContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const filtered = useMemo(() => {
    if (!balanceSummary?.balances) return [];
    const q = searchQuery.toLowerCase();
    if (!q) return balanceSummary.balances;
    return balanceSummary.balances.filter((b) =>
      b.leaveTypeName?.toLowerCase().includes(q)
    );
  }, [balanceSummary, searchQuery]);

  const isAllSelected =
    filtered.length > 0 && filtered.every((b) => selectedIds.includes(b.id));
  const isIndeterminate =
    !isAllSelected && filtered.some((b) => selectedIds.includes(b.id));

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filtered.map((b) => b.id) : []);
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  if (isLoading) {
    return (
      <Card className="gap-0 py-0">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-1">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by leave type..."
            className="h-8 pl-8 text-sm"
          />
        </div>

        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="h-8 w-[110px] text-xs">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-3">
          {selectedIds.length > 0 && (
            <span className="text-xs text-zinc-500">
              {selectedIds.length} selected
            </span>
          )}
          <span className="text-xs text-zinc-500">
            {filtered.length} leave type{filtered.length === 1 ? '' : 's'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 pl-5">
                <Checkbox
                  checked={isAllSelected}
                  data-state={isIndeterminate ? 'indeterminate' : undefined}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Opening</TableHead>
              <TableHead>Accrued</TableHead>
              <TableHead>Carry Forward</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Usage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10}>
                  <Empty variant="inline">
                    <EmptyMedia variant="icon">
                      <FileText className="size-6" />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>No leave balances found</EmptyTitle>
                      <EmptyDescription>
                        {searchQuery
                          ? 'Try adjusting your search'
                          : 'No leave balances are available for the selected year'}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((balance) => {
              const total =
                balance.openingBalance +
                balance.accrued +
                balance.carryForwardFromPrevious;
              const usagePercent = total > 0 ? (balance.used / total) * 100 : 0;

              return (
                <TableRow key={balance.id} className="hover:bg-muted/50">
                  <TableCell className="pl-5">
                    <Checkbox
                      checked={selectedIds.includes(balance.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(balance.id, checked as boolean)
                      }
                      aria-label={`Select ${balance.leaveTypeName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {balance.leaveTypeName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {balance.openingBalance.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-green-600 dark:text-green-400">
                      +{balance.accrued.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-blue-600 dark:text-blue-400">
                      {balance.carryForwardFromPrevious > 0
                        ? `+${balance.carryForwardFromPrevious.toFixed(1)}`
                        : '0.0'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {total.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-red-600 dark:text-red-400">
                      {balance.used.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-yellow-600 dark:text-yellow-400">
                      {balance.pending.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {balance.availableBalance.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-[120px] items-center gap-2">
                      <Progress value={usagePercent} className="h-2 flex-1" />
                      <span className="min-w-[40px] text-xs text-zinc-600 dark:text-zinc-400">
                        {usagePercent.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
