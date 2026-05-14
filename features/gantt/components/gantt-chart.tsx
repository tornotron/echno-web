'use client';

import {
  WbsGanttChart,
  buildProjectGanttMarkers,
} from '@/components/shadcn/gantt';
import type { Task } from '@/types/task';

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
