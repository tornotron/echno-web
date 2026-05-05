'use client';

import { useState, useMemo } from 'react';
import { Search, FileText, TrendingUp, TrendingDown } from 'lucide-react';
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
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Loader2 } from 'lucide-react';
import { Pagination } from '@/components/common';
import { format } from 'date-fns';
import { TransactionType, LeaveTransaction } from '@/types/leave';

interface TransactionsTabContentProps {
  transactions: LeaveTransaction[] | undefined;
  isLoading: boolean;
  selectedYear: string;
  years: string[];
  onYearChange: (year: string) => void;
}

const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.OPENING_BALANCE]: 'Opening Balance',
  [TransactionType.ACCRUAL]: 'Accrual',
  [TransactionType.CARRY_FORWARD]: 'Carry Forward',
  [TransactionType.DEDUCTION]: 'Deduction',
  [TransactionType.REVERSAL]: 'Reversal',
  [TransactionType.ADJUSTMENT]: 'Adjustment',
  [TransactionType.EXPIRY]: 'Expiry',
};

const getTransactionIcon = (type: TransactionType) => {
  switch (type) {
    case TransactionType.ACCRUAL:
    case TransactionType.CARRY_FORWARD:
    case TransactionType.OPENING_BALANCE:
    case TransactionType.REVERSAL:
    case TransactionType.ADJUSTMENT: {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    case TransactionType.DEDUCTION:
    case TransactionType.EXPIRY: {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    default: {
      return <FileText className="text-muted-foreground h-4 w-4" />;
    }
  }
};

const getAmountColor = (type: TransactionType) => {
  switch (type) {
    case TransactionType.ACCRUAL:
    case TransactionType.CARRY_FORWARD:
    case TransactionType.OPENING_BALANCE:
    case TransactionType.REVERSAL: {
      return 'text-green-600 dark:text-green-400';
    }
    case TransactionType.DEDUCTION:
    case TransactionType.EXPIRY: {
      return 'text-red-600 dark:text-red-400';
    }
    case TransactionType.ADJUSTMENT: {
      return 'text-blue-600 dark:text-blue-400';
    }
    default: {
      return 'text-zinc-600 dark:text-zinc-400';
    }
  }
};

export function TransactionsTabContent({
  transactions,
  isLoading,
  selectedYear,
  years,
  onYearChange,
}: TransactionsTabContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const leaveTypeOptions = useMemo(() => {
    if (!transactions) return [];
    const names = transactions
      .map((tx) => tx.leaveTypeName)
      .filter((n): n is string => !!n);
    return [...new Set(names)].toSorted();
  }, [transactions]);

  const filtered = useMemo(() => {
    if (!transactions) return [];
    const q = searchQuery.toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
    const year = Number.parseInt(selectedYear, 10);

    return transactions.filter((tx) => {
      const matchesSearch =
        !q ||
        tx.leaveTypeName?.toLowerCase().includes(q) ||
        tx.reason?.toLowerCase().includes(q);
      const matchesType =
        typeFilter === 'all' || tx.transactionType === typeFilter;
      const matchesLeaveType =
        leaveTypeFilter === 'all' || tx.leaveTypeName === leaveTypeFilter;
      const txDate = new Date(tx.transactionDate);
      const matchesYear = txDate.getFullYear() === year;
      const matchesFrom = !from || txDate >= from;
      const matchesTo = !to || txDate <= to;
      return (
        matchesSearch &&
        matchesType &&
        matchesLeaveType &&
        matchesYear &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [
    transactions,
    searchQuery,
    typeFilter,
    leaveTypeFilter,
    selectedYear,
    dateFrom,
    dateTo,
  ]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleLeaveTypeChange = (value: string) => {
    setLeaveTypeFilter(value);
    setCurrentPage(1);
  };

  const handleDateFrom = (value: string) => {
    setDateFrom(value);
    setCurrentPage(1);
  };

  const handleDateTo = (value: string) => {
    setDateTo(value);
    setCurrentPage(1);
  };

  const handleItemsPerPage = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const isAllSelected =
    paginated.length > 0 &&
    paginated.every((tx) => selectedIds.includes(tx.id));
  const isIndeterminate =
    !isAllSelected && paginated.some((tx) => selectedIds.includes(tx.id));

  const handleSelectAll = (checked: boolean) => {
    const pageIds = paginated.map((tx) => tx.id);
    setSelectedIds((prev) =>
      checked
        ? [...new Set([...prev, ...pageIds])]
        : prev.filter((id) => !pageIds.includes(id))
    );
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
      <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by leave type or reason..."
            className="h-8 pl-8 text-sm"
          />
        </div>

        <Select value={typeFilter} onValueChange={handleTypeChange}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.values(TransactionType).map((type) => (
              <SelectItem key={type} value={type}>
                {TRANSACTION_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={leaveTypeFilter} onValueChange={handleLeaveTypeChange}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue placeholder="All Leave Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leave Types</SelectItem>
            {leaveTypeOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => handleDateFrom(e.target.value)}
          className="h-8 w-[140px] text-xs"
          aria-label="From date"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => handleDateTo(e.target.value)}
          className="h-8 w-[140px] text-xs"
          aria-label="To date"
        />

        <div className="ml-auto flex items-center gap-2 border-l pl-3">
          <span className="text-xs whitespace-nowrap text-zinc-500">
            Rows per page
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPage}
          >
            <SelectTrigger className="h-8 w-[60px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
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
                  aria-label="Select all on page"
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Balance After</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Empty variant="inline">
                    <EmptyMedia variant="icon">
                      <FileText className="size-6" />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>No transactions found</EmptyTitle>
                      <EmptyDescription>
                        Try adjusting your search or filters
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {paginated.map((transaction) => (
              <TableRow key={transaction.id} className="hover:bg-muted/50">
                <TableCell className="pl-5">
                  <Checkbox
                    checked={selectedIds.includes(transaction.id)}
                    onCheckedChange={(checked) =>
                      handleSelectOne(transaction.id, checked as boolean)
                    }
                    aria-label={`Select transaction ${transaction.id}`}
                  />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {format(
                      new Date(transaction.transactionDate),
                      'MMM dd, yyyy'
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {transaction.leaveTypeName || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTransactionIcon(transaction.transactionType)}
                    <Badge variant="outline" className="text-xs">
                      {TRANSACTION_TYPE_LABELS[transaction.transactionType] ??
                        transaction.transactionType.replaceAll('_', ' ')}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`font-semibold ${getAmountColor(transaction.transactionType)}`}
                  >
                    {transaction.days > 0 ? '+' : ''}
                    {transaction.days.toFixed(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {transaction.balanceAfter.toFixed(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {transaction.reason || '—'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <div className="flex items-center justify-between border-t px-4 py-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {selectedIds.length > 0 ? `${selectedIds.length} selected · ` : ''}
          Showing {filtered.length === 0 ? 0 : startIndex + 1}–
          {Math.min(startIndex + itemsPerPage, filtered.length)} of{' '}
          {filtered.length}
        </span>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </Card>
  );
}
