'use client';

import Link from 'next/link';
import { routes } from '@/nav';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { PageHeader, ActiveFilterChip } from '@/components/common';
import {
  useEmployeeFilterFromParams,
  rowMatchesEmployeeFilter,
  ROLE_LABELS,
} from '@/hooks/use-employee-filter';
import {
  PieChart,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { useBudgets } from '@/hooks/budgets';
import { BudgetStatus } from '@/types/finance/budget';
import { BudgetsGrid } from '@/features/budgets';

export default function BudgetsPage() {
  const { data: budgets = [], isLoading, isError } = useBudgets();

  const { employeeId, role, name, clear } = useEmployeeFilterFromParams();
  const filteredBudgets =
    employeeId != null && role
      ? budgets.filter((r) =>
          rowMatchesEmployeeFilter(r, employeeId, role, {
            preparer: (b) => b.preparedBy,
            approver: (b) => b.approvedBy,
          })
        )
      : budgets;

  const totalBudgetsCount = budgets.length;
  const activeBudgets = budgets.filter(
    (b) =>
      b.status === BudgetStatus.active || b.status === BudgetStatus.approved
  ).length;
  const atRiskOrExceeded = budgets.filter(
    (b) => b.isOverBudget || b.percentageUsed >= 80
  ).length;
  const totalAllocated = budgets.reduce((sum, b) => sum + b.totalAllocated, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description="Manage and track project and organization budgets"
        actions={
          <Button asChild>
            <Link href={routes.finance.budgets.new}>
              <Plus className="mr-2 h-4 w-4" />
              Create Budget
            </Link>
          </Button>
        }
      />

      {/* Statistics Cards */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Budgets
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {totalBudgetsCount}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <PieChart className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all time</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Active</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {activeBudgets}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              currently active
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Exceeded / At Risk
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
                {atRiskOrExceeded}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              over budget
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Allocated
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                ₹{(totalAllocated / 1_000_000).toFixed(1)}M
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Wallet className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              all budgets
            </p>
          </div>
        </div>
      </Card>

      {employeeId != null && name && (
        <ActiveFilterChip
          label={ROLE_LABELS[role ?? ''] ?? 'Filtered by'}
          name={name}
          onDismiss={clear}
        />
      )}

      <BudgetsGrid
        budgets={filteredBudgets}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}
