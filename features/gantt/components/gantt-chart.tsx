'use client';

import {
  WbsGanttChart,
  type GanttMarkerProps,
} from '@/components/shadcn/gantt';
import { format } from 'date-fns';
import type { Task } from '@tornotron/echno-core/task/types';

function buildProjectGanttMarkers(tasks: Task[]): GanttMarkerProps[] {
  const markers: GanttMarkerProps[] = [];
  for (const task of tasks) {
    if (!task.endDate) continue;
    markers.push({
      id: `due-${task.id ?? task.title}-${task.endDate.toISOString()}`,
      date: task.endDate,
      label: `Due: ${format(task.endDate, 'dd MMM')}`,
    });
  }
  markers.sort((a, b) => a.date.getTime() - b.date.getTime());
  return markers.slice(0, 6);
}

interface GanttChartProps {
  tasks: Task[];
  projectStart?: Date;
  projectEnd?: Date;
}

export function GanttChart({ tasks }: GanttChartProps) {
  return (
    <WbsGanttChart
      tasks={tasks}
      markers={buildProjectGanttMarkers(tasks)}
      zoom={100}
      range="monthly"
    />
  );
}
