'use client';

import { useExpenses } from '@/hooks/expenses';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { DollarSign, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/nav';
import { ExpenseStatus } from '@/types/finance/expense';
import { ExpensesTable } from '@/features/expenses';

export default function ExpensesPage() {
  const { data: expenses = [], isLoading, isError } = useExpenses();

  const totalExpenses = expenses.length;
  const paidExpenses = expenses.filter(
    (e) =>
      e.status === ExpenseStatus.paid || e.status === ExpenseStatus.reimbursed
  ).length;
  const pendingExpenses = expenses.filter(
    (e) =>
      e.status === ExpenseStatus.pending || e.status === ExpenseStatus.approved
  ).length;
  const totalAmount = expenses.reduce((sum, e) => sum + e.totalAmount, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Expenses"
        description="Track expenses, manage approvals, and monitor reimbursements"
        actions={
          <Button asChild>
            <Link href={routes.finance.expenses.new}>New Expense</Link>
          </Button>
        }
      />

      {/* Statistics Cards */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Expenses
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {totalExpenses}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <DollarSign className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all time</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Paid / Reimbursed
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {paidExpenses}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">settled</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Pending / Approved
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-yellow-600 dark:text-yellow-400">
                {pendingExpenses}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              awaiting payment
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Value
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                ₹{(totalAmount / 100_000).toFixed(2)}L
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <DollarSign className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              all expenses
            </p>
          </div>
        </div>
      </Card>

      <ExpensesTable
        expenses={expenses}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}
