'use client';

import { useState, useMemo } from 'react';
import { mockExpenses } from '@/components/shared/mock-data';
import { AppLayout, Pagination, SearchAndFilter } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, Calendar, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ExpenseType,
  ExpenseStatus,
  ExpenseCategory,
} from '@/types/finance/expense';

const expenseTypeLabels: Record<string, string> = {
  direct: 'Direct',
  indirect: 'Indirect',
  capital: 'Capital',
  operational: 'Operational',
};

const expenseStatusLabels: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid',
  reimbursed: 'Reimbursed',
  cancelled: 'Cancelled',
};

const expenseCategoryLabels: Record<string, string> = {
  materials: 'Materials',
  labour: 'Labour',
  equipment: 'Equipment',
  transport: 'Transport',
  utilities: 'Utilities',
  rent: 'Rent',
  salaries: 'Salaries',
  maintenance: 'Maintenance',
  insurance: 'Insurance',
  legal: 'Legal',
  marketing: 'Marketing',
  office: 'Office',
  travel: 'Travel',
  miscellaneous: 'Miscellaneous',
  other: 'Other',
};

const getStatusColor = (status: ExpenseStatus) => {
  switch (status) {
    case ExpenseStatus.paid:
    case ExpenseStatus.reimbursed: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case ExpenseStatus.approved: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case ExpenseStatus.pending: {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    case ExpenseStatus.draft: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
    case ExpenseStatus.rejected: {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    case ExpenseStatus.cancelled: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

const getTypeColor = (type: ExpenseType) => {
  switch (type) {
    case ExpenseType.direct: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case ExpenseType.indirect: {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    }
    case ExpenseType.capital: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case ExpenseType.operational: {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

export default function ExpensesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Filter expenses based on search and filters
  const filteredExpenses = useMemo(() => {
    return mockExpenses.filter((expense) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        expense.expenseNumber.toLowerCase().includes(searchLower) ||
        expense.description.toLowerCase().includes(searchLower) ||
        expenseCategoryLabels[expense.category]
          ?.toLowerCase()
          .includes(searchLower);

      // Status filter
      const matchesStatus =
        statusFilter === 'all' || expense.status === statusFilter;

      // Type filter
      const matchesType = typeFilter === 'all' || expense.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [searchQuery, statusFilter, typeFilter]);

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  // Calculate stats
  const totalExpenses = mockExpenses.length;
  const paidExpenses = mockExpenses.filter(
    (e) =>
      e.status === ExpenseStatus.paid || e.status === ExpenseStatus.reimbursed
  ).length;
  const pendingExpenses = mockExpenses.filter(
    (e) =>
      e.status === ExpenseStatus.pending || e.status === ExpenseStatus.approved
  ).length;
  const totalAmount = mockExpenses.reduce((sum, e) => sum + e.totalAmount, 0);

  // Selection handlers
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
    selectedIds.length === paginatedExpenses.length;

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
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Expenses
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Track expenses, manage approvals, and monitor reimbursements
            </p>
          </div>
          <Button asChild>
            <Link href="/users/dashboard/finance/expenses/new">
              <DollarSign className="mr-2 h-4 w-4" />
              New Expense
            </Link>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {totalExpenses}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Paid/Reimbursed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {paidExpenses}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending/Approved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {pendingExpenses}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  ₹{(totalAmount / 100_000).toFixed(2)}L
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <SearchAndFilter
          variant="card"
          searchValue={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search by expense number, description..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          filters={[
            {
              placeholder: 'Status',
              options: [
                { value: 'all', label: 'All Status' },
                {
                  value: ExpenseStatus.draft,
                  label: expenseStatusLabels[ExpenseStatus.draft],
                },
                {
                  value: ExpenseStatus.pending,
                  label: expenseStatusLabels[ExpenseStatus.pending],
                },
                {
                  value: ExpenseStatus.approved,
                  label: expenseStatusLabels[ExpenseStatus.approved],
                },
                {
                  value: ExpenseStatus.paid,
                  label: expenseStatusLabels[ExpenseStatus.paid],
                },
                {
                  value: ExpenseStatus.reimbursed,
                  label: expenseStatusLabels[ExpenseStatus.reimbursed],
                },
                {
                  value: ExpenseStatus.rejected,
                  label: expenseStatusLabels[ExpenseStatus.rejected],
                },
                {
                  value: ExpenseStatus.cancelled,
                  label: expenseStatusLabels[ExpenseStatus.cancelled],
                },
              ],
              value: statusFilter,
              onChange: (value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              },
            },
            {
              placeholder: 'Type',
              options: [
                { value: 'all', label: 'All Types' },
                {
                  value: ExpenseType.direct,
                  label: expenseTypeLabels[ExpenseType.direct],
                },
                {
                  value: ExpenseType.indirect,
                  label: expenseTypeLabels[ExpenseType.indirect],
                },
                {
                  value: ExpenseType.capital,
                  label: expenseTypeLabels[ExpenseType.capital],
                },
                {
                  value: ExpenseType.operational,
                  label: expenseTypeLabels[ExpenseType.operational],
                },
              ],
              value: typeFilter,
              onChange: (value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              },
            },
          ]}
        />

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to{' '}
            {Math.min(endIndex, filteredExpenses.length)} of{' '}
            {filteredExpenses.length} expenses
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Rows per page:
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
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
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expenses Table */}
        {filteredExpenses.length > 0 ? (
          <Card>
            <CardContent className="p-0">
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
                    <TableRow
                      key={expense.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() =>
                        (globalThis.location.href = `/dashboard/finance/expenses/${expense.id}`)
                      }
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(expense.id)}
                          onCheckedChange={(checked) =>
                            handleSelectOne(expense.id, checked as boolean)
                          }
                          aria-label={`Select ${expense.expenseNumber}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                            <DollarSign className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {expense.expenseNumber}
                            </p>
                            {expense.billNumber && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                Bill: {expense.billNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-zinc-700 dark:text-zinc-300">
                          {expense.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          {expenseCategoryLabels[expense.category] ||
                            expense.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(expense.type)}>
                          {expenseTypeLabels[expense.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(expense.status)}>
                          {expenseStatusLabels[expense.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          ₹{expense.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            expense.paidAmount > 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-zinc-500'
                          }
                        >
                          ₹{expense.paidAmount.toLocaleString('en-IN')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            expense.balanceAmount > 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }
                        >
                          ₹{expense.balanceAmount.toLocaleString('en-IN')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </Card>
        ) : (
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <div className="text-center">
                <DollarSign className="mx-auto h-12 w-12 text-zinc-400" />
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  No expenses found
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {hasActiveFilters
                    ? 'Try adjusting your filters'
                    : 'Get started by recording a new expense'}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
