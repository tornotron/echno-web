'use client';

import { GanttChart as GanttIcon, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { GanttChart } from './gantt-chart';
import type { Project } from '@/types/project';
import { TaskStatus } from '@/types/task';

interface ScheduleTabProps {
  project: Project;
}

export function ScheduleTab({ project }: ScheduleTabProps) {
  const tasks = project.tasks ?? [];
  const tasksWithDates = tasks.filter((t) => t.startDate && t.endDate);

  const criticalCount = (() => {
    const dated = tasks.filter((t) => t.endDate);
    if (dated.length === 0) return 0;
    const projectEnd = new Date(
      Math.max(...dated.map((t) => t.endDate!.getTime()))
    );
    return dated.filter((t) => t.endDate! >= projectEnd).length;
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            <GanttIcon className="h-5 w-5 text-blue-600" />
            Project Schedule
          </h3>
          <p className="text-sm text-zinc-500">
            {tasks.length} tasks · {tasksWithDates.length} with dates
          </p>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {criticalCount} task{criticalCount > 1 ? 's' : ''} on critical path
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GanttIcon className="mx-auto mb-3 h-12 w-12 text-zinc-300 dark:text-zinc-600" />
            <p className="text-zinc-500">
              No tasks found. Create tasks with start and end dates to see the
              Gantt chart.
            </p>
          </CardContent>
        </Card>
      ) : (
        <GanttChart
          tasks={tasks}
          projectStart={project.startDate}
          projectEnd={project.endDate}
        />
      )}

      {tasks.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total Tasks', value: tasks.length },
            { label: 'With Dates', value: tasksWithDates.length },
            {
              label: 'Completed',
              value: tasks.filter((t) => t.status === TaskStatus.completed)
                .length,
            },
            { label: 'Critical Path', value: criticalCount },
          ].map((s) => (
            <Card key={s.label}>
              <CardHeader className="pt-3 pb-1">
                <CardTitle className="text-xs font-medium text-zinc-500">
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {s.value}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
