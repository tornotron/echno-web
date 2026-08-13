'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/nav';
import { DataTable, type DataTableColumn } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { TableCell } from '@/components/shadcn/table';
import { DollarSign } from 'lucide-react';
import {
  Expense,
  ExpenseType,
  ExpenseStatus,
  expenseTypeLabels,
  expenseStatusLabels,
  expenseCategoryLabels,
} from '@/types/finance/expense';

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

const columns: DataTableColumn<Expense>[] = [
  {
    id: 'expenseNumber',
    header: 'Expense #',
    cell: (expense) => (
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
    ),
  },
  {
    id: 'description',
    header: 'Description',
    cell: (expense) => (
      <TableCell>
        <div className="max-w-xs truncate text-sm text-zinc-700 dark:text-zinc-300">
          {expense.description}
        </div>
      </TableCell>
    ),
  },
  {
    id: 'category',
    header: 'Category',
    cell: (expense) => (
      <TableCell>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {expenseCategoryLabels[expense.category] || expense.category}
        </span>
      </TableCell>
    ),
  },
  {
    id: 'type',
    header: 'Type',
    cell: (expense) => (
      <TableCell>
        <Badge className={getTypeColor(expense.type)}>
          {expenseTypeLabels[expense.type]}
        </Badge>
      </TableCell>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (expense) => (
      <TableCell>
        <Badge className={getStatusColor(expense.status)}>
          {expenseStatusLabels[expense.status]}
        </Badge>
      </TableCell>
    ),
  },
  {
    id: 'amount',
    header: 'Amount',
    headClassName: 'text-right',
    cell: (expense) => (
      <TableCell className="text-right">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          ₹{expense.totalAmount.toLocaleString('en-IN')}
        </span>
      </TableCell>
    ),
  },
  {
    id: 'paid',
    header: 'Paid',
    headClassName: 'text-right',
    cell: (expense) => (
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
    ),
  },
  {
    id: 'balance',
    header: 'Balance',
    headClassName: 'text-right',
    cell: (expense) => (
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
    ),
  },
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: ExpenseStatus.draft, label: expenseStatusLabels[ExpenseStatus.draft] },
  {
    value: ExpenseStatus.pending,
    label: expenseStatusLabels[ExpenseStatus.pending],
  },
  {
    value: ExpenseStatus.approved,
    label: expenseStatusLabels[ExpenseStatus.approved],
  },
  { value: ExpenseStatus.paid, label: expenseStatusLabels[ExpenseStatus.paid] },
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
];

const typeOptions = [
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
];

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

  return (
    <DataTable<Expense>
      data={expenses}
      columns={columns}
      getRowId={(expense) => expense.id}
      isLoading={isLoading}
      isError={isError}
      enableSelection
      searchPlaceholder="Search by expense number, description..."
      searchPredicate={(expense, query) => {
        const searchLower = query.toLowerCase();
        return (
          expense.expenseNumber.toLowerCase().includes(searchLower) ||
          expense.description.toLowerCase().includes(searchLower) ||
          (expenseCategoryLabels[expense.category]
            ?.toLowerCase()
            .includes(searchLower) ??
            false)
        );
      }}
      filters={[
        {
          id: 'status',
          placeholder: 'Status',
          options: statusOptions,
          predicate: (expense, value) => expense.status === value,
        },
        {
          id: 'type',
          placeholder: 'Type',
          options: typeOptions,
          predicate: (expense, value) => expense.type === value,
        },
      ]}
      onRowClick={(expense) =>
        router.push(routes.finance.expenses.detail(expense.id).href)
      }
      entityNoun={{ one: 'expense', many: 'expenses' }}
      errorIcon={<DollarSign className="size-6" />}
      errorTitle="Failed to load expenses"
      emptyIcon={<DollarSign className="size-6" />}
      emptyTitle="No expenses found"
      emptyDescription="Add your first expense to get started."
      emptyAction={
        <Button asChild>
          <Link href={routes.finance.expenses.new}>New Expense</Link>
        </Button>
      }
    />
  );
}
