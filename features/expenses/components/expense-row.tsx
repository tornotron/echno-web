'use client';

import { Checkbox } from '@/components/shadcn/checkbox';
import { Badge } from '@/components/shadcn/badge';
import { TableRow, TableCell } from '@/components/shadcn/table';
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

export interface ExpenseRowProps {
  expense: Expense;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onClick: () => void;
}

export function ExpenseRow({
  expense,
  isSelected,
  onSelect,
  onClick,
}: ExpenseRowProps) {
  return (
    <TableRow
      role="button"
      tabIndex={0}
      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === ' ') {
          e.preventDefault();
          onClick();
        } else if (e.key === 'Enter') {
          onClick();
        }
      }}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(checked as boolean)}
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
          {expenseCategoryLabels[expense.category] || expense.category}
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
  );
}
