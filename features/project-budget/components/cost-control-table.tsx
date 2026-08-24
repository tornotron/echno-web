'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
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
import { BarChart3 } from 'lucide-react';
import { useProjectCostControl } from '@tornotron/echno-core/finance/hooks';
import type { ProjectCostControlLine } from '@tornotron/echno-core/finance/types';
import { cn } from '@/lib/utils/index';
import { formatBudgetAmount } from '../utils/format';

interface CostControlTableProps {
  projectId: number;
}

/**
 * The headline cost-control view: Allocated -> Committed -> Spent -> Remaining
 * per cost category, with a consumption bar and an over-budget flag on any
 * category whose commitments and spend exceed its allocation.
 */
export function CostControlTable({ projectId }: CostControlTableProps) {
  const {
    data: costControl,
    isLoading,
    isError,
  } = useProjectCostControl(projectId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5" />
          Cost control
        </CardTitle>
        <CardDescription>
          Budget allocated versus committed and spent, per cost category.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}

        {isError && (
          <p className="text-destructive text-sm">
            Failed to load the cost-control report. Please try again.
          </p>
        )}

        {!isLoading &&
          !isError &&
          costControl &&
          costControl.categories.length === 0 && (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No cost data yet. Allocate a budget and tag invoice lines with
              cost categories to populate this report.
            </p>
          )}

        {!isLoading &&
          !isError &&
          costControl &&
          costControl.categories.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">
                      Cost category
                    </TableHead>
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
                    <TableHead className="min-w-[140px]">Consumption</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costControl.categories.map((line) => (
                    <CostControlRow
                      key={line.costCategoryId ?? line.costCategoryName}
                      line={line}
                    />
                  ))}
                </TableBody>
                <TableFooter>
                  <CostControlRow line={costControl.totals} isTotal />
                </TableFooter>
              </Table>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

interface CostControlRowProps {
  line: ProjectCostControlLine;
  isTotal?: boolean;
}

function CostControlRow({ line, isTotal }: CostControlRowProps) {
  const consumed = line.committed + line.spent;
  const percent =
    line.allocated > 0
      ? Math.min(100, (consumed / line.allocated) * 100)
      : consumed > 0
        ? 100
        : 0;

  return (
    <TableRow className={cn(isTotal && 'font-semibold')}>
      <TableCell className={cn(!isTotal && 'font-medium')}>
        <div className="flex items-center gap-2">
          <span>{line.costCategoryName}</span>
          {line.overBudget && (
            <Badge variant="destructive" className="text-[10px]">
              Over budget
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatBudgetAmount(line.allocated)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatBudgetAmount(line.committed)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatBudgetAmount(line.spent)}
      </TableCell>
      <TableCell
        className={cn(
          'text-right tabular-nums',
          line.overBudget
            ? 'font-semibold text-red-600 dark:text-red-400'
            : 'text-emerald-600 dark:text-emerald-400'
        )}
      >
        {formatBudgetAmount(line.remaining)}
      </TableCell>
      <TableCell>
        <ConsumptionBar percent={percent} overBudget={line.overBudget} />
      </TableCell>
    </TableRow>
  );
}

function ConsumptionBar({
  percent,
  overBudget,
}: {
  percent: number;
  overBudget: boolean;
}) {
  const barColor = overBudget
    ? 'bg-red-500'
    : percent >= 90
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-muted-foreground w-9 shrink-0 text-right text-xs tabular-nums">
        {Math.round(percent)}%
      </span>
    </div>
  );
}
