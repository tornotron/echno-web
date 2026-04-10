'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FlameKindling, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useConsumptionsByTask } from '@/hooks/materials';
import { ConsumptionType, consumptionTypeLabels } from '@/types/materials';
import type { Task } from '@/types/task/task';

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

  const recordHref = `/users/dashboard/resources/material-consumptions/new?taskId=${task.id}&taskTitle=${encodeURIComponent(task.title)}`;

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
                      `/users/dashboard/resources/material-consumptions/${c.id}`
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
          <div className="py-12 text-center">
            <FlameKindling className="mx-auto mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              No material consumptions recorded yet
            </p>
            <Link href={recordHref}>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Record First Consumption
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
