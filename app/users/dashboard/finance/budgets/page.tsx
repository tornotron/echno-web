'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQueries } from '@tanstack/react-query';
import { routes } from '@/nav';
import { PageHeader } from '@/components/common';
import { Card, CardContent } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { Wallet, AlertTriangle, PieChart } from 'lucide-react';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { financeKeys } from '@tornotron/echno-core/finance/hooks';
import { financeProjectBudgetService } from '@tornotron/echno-core/finance-project-budget/services';
import type { ProjectCostControl } from '@tornotron/echno-core/finance/types';
import { formatBudgetAmount } from '@/features/project-budget/utils/format';

interface ProjectBudgetRow {
  projectId: number;
  projectName: string;
  allocated: number;
  committed: number;
  spent: number;
  remaining: number;
  overBudget: boolean;
  isError: boolean;
}

export default function BudgetsPage() {
  const {
    data: projects = [],
    isLoading: projectsLoading,
    isError: projectsError,
  } = useProjects();

  // One cost-control roll-up per project, fetched in parallel. The queries reuse
  // the same key + service the per-project Budget tab uses, so the cache is
  // shared and drilling into a project reads from an already-warm entry.
  const costControlQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: financeKeys.projectCostControl(project.id),
      queryFn: () => financeProjectBudgetService.getCostControl(project.id),
      enabled: projects.length > 0,
      staleTime: 60_000,
    })),
  });

  const costControlLoading = costControlQueries.some((q) => q.isLoading);
  const isLoading = projectsLoading || (projects.length > 0 && costControlLoading);

  const rows: ProjectBudgetRow[] = useMemo(() => {
    return projects.map((project, index) => {
      const query = costControlQueries[index];
      const report = query?.data as ProjectCostControl | undefined;
      const totals = report?.totals;
      const allocated = totals?.allocated ?? 0;
      const committed = totals?.committed ?? 0;
      const spent = totals?.spent ?? 0;
      const remaining = totals?.remaining ?? 0;

      return {
        projectId: project.id,
        projectName: project.projectName,
        allocated,
        committed,
        spent,
        remaining,
        overBudget: (totals?.overBudget ?? false) || remaining < 0,
        isError: query?.isError ?? false,
      };
    });
    // costControlQueries is a fresh array each render; depend on the projects
    // and the settled data snapshot instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, costControlQueries.map((q) => q.dataUpdatedAt).join(',')]);

  const orgTotals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.allocated += row.allocated;
        acc.committed += row.committed;
        acc.spent += row.spent;
        acc.remaining += row.remaining;
        return acc;
      },
      { allocated: 0, committed: 0, spent: 0, remaining: 0 }
    );
  }, [rows]);

  const overBudgetCount = rows.filter((row) => row.overBudget).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Budgets"
        description="Per-project budget allocation, commitment, and spend across the organization"
      />

      {/* Summary */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Projects</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {projects.length}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <PieChart className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              with budgets
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Allocated
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {formatBudgetAmount(orgTotals.allocated)}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Wallet className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              across projects
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Spent
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {formatBudgetAmount(orgTotals.spent)}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Wallet className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              committed and settled
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Over Budget
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
                {overBudgetCount}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">projects</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}

          {!isLoading && projectsError && (
            <p className="text-destructive text-sm">
              Failed to load projects. Please try again.
            </p>
          )}

          {!isLoading && !projectsError && rows.length === 0 && (
            <p className="text-muted-foreground py-10 text-center text-sm">
              No project budgets yet. Create a project and allocate a budget in
              its Budget tab to see it here.
            </p>
          )}

          {!isLoading && !projectsError && rows.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Project</TableHead>
                    <TableHead className="min-w-[120px] text-right">
                      Allocated
                    </TableHead>
                    <TableHead className="min-w-[120px] text-right">
                      Committed
                    </TableHead>
                    <TableHead className="min-w-[120px] text-right">
                      Spent
                    </TableHead>
                    <TableHead className="min-w-[120px] text-right">
                      Remaining
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.projectId}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            href={
                              routes.portfolio.projects.allProjects.detail(
                                row.projectId
                              ).href
                            }
                            className="hover:text-primary hover:underline"
                          >
                            {row.projectName}
                          </Link>
                          {row.overBudget && (
                            <Badge
                              variant="destructive"
                              className="text-[10px]"
                            >
                              Over budget
                            </Badge>
                          )}
                          {row.isError && (
                            <span className="text-muted-foreground text-xs">
                              unavailable
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBudgetAmount(row.allocated)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBudgetAmount(row.committed)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBudgetAmount(row.spent)}
                      </TableCell>
                      <TableCell
                        className={
                          row.overBudget
                            ? 'text-right font-semibold tabular-nums text-red-600 dark:text-red-400'
                            : 'text-right tabular-nums text-emerald-600 dark:text-emerald-400'
                        }
                      >
                        {formatBudgetAmount(row.remaining)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBudgetAmount(orgTotals.allocated)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBudgetAmount(orgTotals.committed)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBudgetAmount(orgTotals.spent)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBudgetAmount(orgTotals.remaining)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
