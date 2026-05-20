'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Pagination } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import {
  Table,
  TableBody,
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
import { DollarSign, Search, Loader2 } from 'lucide-react';
import {
  Empty,
  EmptyErrorMedia,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import Link from 'next/link';
import {
  Expense,
  ExpenseType,
  ExpenseStatus,
  expenseTypeLabels,
  expenseStatusLabels,
  expenseCategoryLabels,
} from '@/types/finance/expense';
import { ExpenseRow } from './expense-row';

export interface ExpensesTableProps {
  expenses: Expense[];
  isLoading: boolean;
  isError: boolean;
}

export function ExpensesTable({
  expenses,
  isLoading,
  isError,
}: ExpensesTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        expense.expenseNumber.toLowerCase().includes(searchLower) ||
        expense.description.toLowerCase().includes(searchLower) ||
        expenseCategoryLabels[expense.category]
          ?.toLowerCase()
          .includes(searchLower);

      const matchesStatus =
        statusFilter === 'all' || expense.status === statusFilter;

      const matchesType = typeFilter === 'all' || expense.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [expenses, searchQuery, statusFilter, typeFilter]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedExpenses.map((e) => e.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const isAllSelected =
    paginatedExpenses.length > 0 &&
    paginatedExpenses.every((e) => selectedIds.includes(e.id));

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCurrentPage(1);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
        {/* Search input */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by expense number, description..."
            className="h-8 pl-8 text-sm"
          />
        </div>
        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value={ExpenseStatus.draft}>
              {expenseStatusLabels[ExpenseStatus.draft]}
            </SelectItem>
            <SelectItem value={ExpenseStatus.pending}>
              {expenseStatusLabels[ExpenseStatus.pending]}
            </SelectItem>
            <SelectItem value={ExpenseStatus.approved}>
              {expenseStatusLabels[ExpenseStatus.approved]}
            </SelectItem>
            <SelectItem value={ExpenseStatus.paid}>
              {expenseStatusLabels[ExpenseStatus.paid]}
            </SelectItem>
            <SelectItem value={ExpenseStatus.reimbursed}>
              {expenseStatusLabels[ExpenseStatus.reimbursed]}
            </SelectItem>
            <SelectItem value={ExpenseStatus.rejected}>
              {expenseStatusLabels[ExpenseStatus.rejected]}
            </SelectItem>
            <SelectItem value={ExpenseStatus.cancelled}>
              {expenseStatusLabels[ExpenseStatus.cancelled]}
            </SelectItem>
          </SelectContent>
        </Select>
        {/* Type filter */}
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value={ExpenseType.direct}>
              {expenseTypeLabels[ExpenseType.direct]}
            </SelectItem>
            <SelectItem value={ExpenseType.indirect}>
              {expenseTypeLabels[ExpenseType.indirect]}
            </SelectItem>
            <SelectItem value={ExpenseType.capital}>
              {expenseTypeLabels[ExpenseType.capital]}
            </SelectItem>
            <SelectItem value={ExpenseType.operational}>
              {expenseTypeLabels[ExpenseType.operational]}
            </SelectItem>
          </SelectContent>
        </Select>
        {/* Rows per page */}
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
              {[5, 10, 20, 50, 100].map((n) => (
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
                    <DollarSign className="size-6" />
                  </EmptyErrorMedia>
                  <EmptyHeader>
                    <EmptyTitle>Failed to load expenses</EmptyTitle>
                    <EmptyDescription>
                      An unexpected error occurred. Please try again.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            );
          if (paginatedExpenses.length > 0)
            return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Expense #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExpenses.map((expense) => (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      isSelected={selectedIds.includes(expense.id)}
                      onSelect={(checked) =>
                        handleSelectOne(expense.id, checked)
                      }
                      onClick={() =>
                        router.push(
                          routes.finance.expenses.detail(expense.id).href
                        )
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
                  <DollarSign className="size-6" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No expenses found</EmptyTitle>
                  <EmptyDescription>
                    {hasActiveFilters
                      ? 'Try adjusting your search or filters.'
                      : 'Add your first expense to get started.'}
                  </EmptyDescription>
                </EmptyHeader>
                {!hasActiveFilters && (
                  <Button asChild>
                    <Link href={routes.finance.expenses.new}>New Expense</Link>
                  </Button>
                )}
              </Empty>
            </CardContent>
          );
        })()}
      </CardContent>

      <div className="flex items-center justify-between border-t px-4 py-2">
        <span className="text-sm text-zinc-500">
          {filteredExpenses.length === 0
            ? '0 records'
            : `${startIndex + 1}–${Math.min(endIndex, filteredExpenses.length)} of ${filteredExpenses.length} ${filteredExpenses.length === 1 ? 'expense' : 'expenses'}`}
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
