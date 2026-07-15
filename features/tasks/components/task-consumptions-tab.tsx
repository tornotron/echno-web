'use client';

import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { FlameKindling, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ConsumptionType,
  consumptionTypeLabels,
} from '@tornotron/echno-core/materials/types';
import { useConsumptionsByTask } from '@tornotron/echno-core/material-consumption/hooks';
import type { Task } from '@tornotron/echno-core/task/types';

const consumptionTypeBadgeColors: Record<ConsumptionType, string> = {
  [ConsumptionType.usedFromStock]:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  [ConsumptionType.transferred]:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
};

interface TaskConsumptionsTabProps {
  task: Task;
}

export function TaskConsumptionsTab({ task }: TaskConsumptionsTabProps) {
  const router = useRouter();
  const { data: consumptions = [], isLoading } = useConsumptionsByTask(
    task.id ?? 0
  );

  const recordHref = `${routes.resources.materialConsumptions.new}?taskId=${task.id}&taskTitle=${encodeURIComponent(task.title)}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FlameKindling className="h-5 w-5" />
              Material Consumptions
              {consumptions.length > 0 && (
                <Badge variant="outline">{consumptions.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Materials consumed for this task</CardDescription>
          </div>
          <Link href={recordHref}>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Record Consumption
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : consumptions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Recorded By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consumptions.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  onClick={() =>
                    router.push(
                      routes.resources.materialConsumptions.detail(c.id).href
                    )
                  }
                >
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(c.consumptionDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {c.materialName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={consumptionTypeBadgeColors[c.consumptionType]}
                    >
                      {consumptionTypeLabels[c.consumptionType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {c.quantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {c.createdBy.name}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Empty variant="inline">
            <EmptyMedia variant="icon">
              <FlameKindling className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No consumptions recorded yet</EmptyTitle>
              <EmptyDescription>
                Track material usage for this task
              </EmptyDescription>
            </EmptyHeader>
            <Button size="sm" variant="outline" asChild>
              <Link href={recordHref}>
                <Plus className="mr-2 h-4 w-4" />
                Record First Consumption
              </Link>
            </Button>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
