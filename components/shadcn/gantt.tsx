'use client';

import { useMemo, useState } from 'react';
import { addDays } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  GanttCreateMarkerTrigger,
  GanttFeatureItem,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttHeader,
  GanttMarker,
  GanttProvider,
  GanttSidebar,
  GanttSidebarItem,
  GanttTimeline,
  GanttToday,
  type GanttFeature,
  type GanttMarkerProps,
  type GanttStatus,
  type Range,
} from '@/components/kibo-ui/gantt';
import { Badge } from '@/components/ui/badge';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils/index';
import {
  Task,
  TaskStatus,
  getTaskStatusLabel,
} from '@tornotron/echno-core/task/types';

type ProjectGanttTask = Task & {
  ganttId: string;
  isCritical?: boolean;
  isNearCritical?: boolean;
};

type LegendItem = {
  label: string;
  color: string;
  marker?: boolean;
};

const LEGEND_ITEMS: LegendItem[] = [
  { label: 'Critical path', color: '#EF4444' },
  { label: 'Near-critical', color: '#F59E0B' },
  { label: 'In progress', color: '#3B82F6' },
  { label: 'Completed', color: '#22C55E' },
  { label: 'Upcoming', color: '#94A3B8' },
  { label: 'Today', color: '#F43F5E', marker: true },
];

const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.upcoming]: '#94A3B8',
  [TaskStatus.onGoing]: '#3B82F6',
  [TaskStatus.onHold]: '#F59E0B',
  [TaskStatus.completed]: '#22C55E',
};

function detectCriticalPath(tasks: Task[]): ProjectGanttTask[] {
  const withDates = tasks.filter((task) => task.startDate && task.endDate);

  if (withDates.length === 0) {
    const result: ProjectGanttTask[] = [];
    for (const task of tasks) {
      result.push({
        ...task,
        ganttId: String(task.id ?? `${task.projectId}-${task.title}`),
      });
    }
    return result;
  }

  let latestEndMs = withDates[0]!.endDate!.getTime();
  for (const task of withDates) {
    const endMs = task.endDate!.getTime();
    if (endMs > latestEndMs) {
      latestEndMs = endMs;
    }
  }

  const projectEnd = new Date(latestEndMs);
  const nearCriticalThreshold = addDays(projectEnd, -7);

  const result: ProjectGanttTask[] = [];
  for (const task of tasks) {
    const isCritical = Boolean(task.endDate && task.endDate >= projectEnd);
    const isNearCritical = Boolean(
      task.endDate && !isCritical && task.endDate >= nearCriticalThreshold
    );

    result.push({
      ...task,
      ganttId: String(task.id ?? `${task.projectId}-${task.title}`),
      isCritical,
      isNearCritical,
    });
  }

  return result;
}

function getTaskDisplayColor(task: ProjectGanttTask): string {
  if (task.isCritical) return '#EF4444';
  if (task.isNearCritical) return '#F59E0B';
  return STATUS_COLORS[task.status] ?? '#94A3B8';
}

function toGanttFeature(task: ProjectGanttTask): GanttFeature | null {
  if (!task.startDate || !task.endDate) {
    return null;
  }

  const color = getTaskDisplayColor(task);
  let statusLabel = getTaskStatusLabel(task.status);
  if (task.isCritical) {
    statusLabel = 'Critical path';
  } else if (task.isNearCritical) {
    statusLabel = 'Near-critical';
  }

  const status: GanttStatus = {
    id: `${task.ganttId}-status`,
    name: statusLabel,
    color,
  };

  const lane = task.category?.name || 'General';

  return {
    id: task.ganttId,
    name: task.title,
    startAt: task.startDate,
    endAt: task.endDate,
    lane,
    status,
  };
}

function FeatureCard({
  task,
  onSelectTask,
}: {
  task: ProjectGanttTask;
  onSelectTask?: (task: ProjectGanttTask) => void;
}) {
  const color = getTaskDisplayColor(task);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          className="h-full w-full"
          onClick={() => onSelectTask?.(task)}
          type="button"
        >
          <div
            className={cn(
              'relative flex h-full w-full items-center gap-2 rounded-sm border px-2 text-left'
            )}
            style={{
              borderColor: color,
              backgroundColor: `${color}1A`,
            }}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <p className="flex-1 truncate pr-1 text-xs font-medium">
              {task.title}
            </p>
          </div>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onSelectTask?.(task)}>
          View task
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export interface ProjectGanttChartProps {
  tasks: Task[];
  className?: string;
  onTaskSelect?: (task: ProjectGanttTask) => void;
  onTaskMove?: (id: string, startAt: Date, endAt: Date | null) => void;
  onCreateMarker?: (date: Date) => void;
  markers?: GanttMarkerProps[];
  zoom?: number;
  range?: Range;
}

type WbsGroup = {
  name: string;
  progress: number;
  done: number;
  total: number;
  features: GanttFeature[];
};

function buildWbsGroups(
  features: GanttFeature[],
  taskByGanttId: Map<string, ProjectGanttTask>
): WbsGroup[] {
  const map = new Map<string, GanttFeature[]>();
  for (const feature of features) {
    const key = feature.lane || 'General';
    const laneItems = map.get(key) ?? [];
    laneItems.push(feature);
    map.set(key, laneItems);
  }

  const groups: WbsGroup[] = [];
  for (const [name, items] of map.entries()) {
    let sumProgress = 0;
    let done = 0;
    for (const item of items) {
      const task = taskByGanttId.get(item.id);
      if (!task) continue;
      sumProgress += task.progress;
      if (task.status === TaskStatus.completed) done += 1;
    }

    groups.push({
      name,
      done,
      total: items.length,
      progress: items.length > 0 ? Math.round(sumProgress / items.length) : 0,
      features: items.toSorted(
        (a, b) => a.startAt.getTime() - b.startAt.getTime()
      ),
    });
  }

  groups.sort((a, b) => a.name.localeCompare(b.name));
  return groups;
}

export function ProjectGanttChart({
  tasks,
  className,
  onTaskSelect,
  onTaskMove,
  onCreateMarker,
  markers = [],
  zoom = 100,
  range = 'monthly',
}: ProjectGanttChartProps) {
  const normalizedTasks = useMemo(() => detectCriticalPath(tasks), [tasks]);
  const tasksWithDates = normalizedTasks.filter(
    (task) => task.startDate && task.endDate
  );
  const tasksWithoutDatesCount = normalizedTasks.length - tasksWithDates.length;

  const features = useMemo<GanttFeature[]>(() => {
    const items: GanttFeature[] = [];
    for (const task of tasksWithDates) {
      const feature = toGanttFeature(task);
      if (feature) items.push(feature);
    }
    items.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    return items;
  }, [tasksWithDates]);

  const laneMap = useMemo(() => {
    const map = new Map<string, GanttFeature[]>();
    for (const feature of features) {
      const key = feature.lane || 'General';
      const laneItems = map.get(key) ?? [];
      laneItems.push(feature);
      map.set(key, laneItems);
    }
    const entries = [...map.entries()];
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    return entries;
  }, [features]);

  const taskByGanttId = useMemo(() => {
    const map = new Map<string, ProjectGanttTask>();
    for (const task of normalizedTasks) {
      map.set(task.ganttId, task);
    }
    return map;
  }, [normalizedTasks]);

  const handleMoveFeature = (id: string, startAt: Date, endAt: Date | null) => {
    onTaskMove?.(id, startAt, endAt);
  };

  return (
    <div className={cn('overflow-hidden rounded-lg border', className)}>
      <div className="bg-muted/30 flex flex-wrap items-center gap-4 border-b px-4 py-2">
        {LEGEND_ITEMS.map((item) => (
          <div
            className="text-muted-foreground flex items-center gap-1.5 text-xs"
            key={item.label}
          >
            <span
              className={cn(
                item.marker ? 'h-3 w-0.5 rounded-none' : 'h-3 w-5 rounded-md'
              )}
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </div>
        ))}
        {tasksWithoutDatesCount > 0 && (
          <Badge className="ml-auto" variant="secondary">
            {tasksWithoutDatesCount} without dates
          </Badge>
        )}
      </div>

      <GanttProvider
        className="rounded-none border-0"
        range={range}
        zoom={zoom}
      >
        <GanttSidebar>
          {laneMap.map(([laneName, laneFeatures]) => (
            <div key={laneName}>
              <div
                className="text-muted-foreground w-full truncate p-2.5 text-left text-xs font-medium"
                style={{ height: 'var(--gantt-row-height)' }}
              >
                {laneName}
              </div>
              {laneFeatures.map((feature) => (
                <GanttSidebarItem
                  feature={feature}
                  key={feature.id}
                  onSelectItem={(id) => {
                    const task = taskByGanttId.get(id);
                    if (task) onTaskSelect?.(task);
                  }}
                />
              ))}
            </div>
          ))}
        </GanttSidebar>

        <GanttTimeline>
          <GanttHeader />
          <GanttFeatureList>
            {laneMap.map(([laneName, laneFeatures]) => (
              <GanttFeatureListGroup key={laneName}>
                {laneFeatures.map((feature) => {
                  const task = taskByGanttId.get(feature.id);
                  if (!task) return null;
                  return (
                    <div className="flex" key={feature.id}>
                      <GanttFeatureItem {...feature} onMove={handleMoveFeature}>
                        <FeatureCard onSelectTask={onTaskSelect} task={task} />
                      </GanttFeatureItem>
                    </div>
                  );
                })}
              </GanttFeatureListGroup>
            ))}
          </GanttFeatureList>

          {markers.map((marker) => (
            <GanttMarker
              {...marker}
              className="bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
              key={marker.id}
            />
          ))}
          <GanttToday className="bg-rose-500 text-white" />
          {onCreateMarker && (
            <GanttCreateMarkerTrigger onCreateMarker={onCreateMarker} />
          )}
        </GanttTimeline>
      </GanttProvider>

      {tasksWithoutDatesCount > 0 && (
        <div className="bg-muted/20 text-muted-foreground border-t px-4 py-2 text-xs">
          {tasksWithoutDatesCount} task(s) have no start/end dates and are not
          shown on the timeline.
        </div>
      )}
    </div>
  );
}

export function WbsGanttChart(props: ProjectGanttChartProps) {
  const {
    tasks,
    className,
    onTaskSelect,
    onTaskMove,
    onCreateMarker,
    markers = [],
    zoom = 100,
    range = 'monthly',
  } = props;

  const normalizedTasks = useMemo(() => detectCriticalPath(tasks), [tasks]);
  const tasksWithDates = normalizedTasks.filter(
    (task) => task.startDate && task.endDate
  );
  const tasksWithoutDatesCount = normalizedTasks.length - tasksWithDates.length;

  const features = useMemo<GanttFeature[]>(() => {
    const items: GanttFeature[] = [];
    for (const task of tasksWithDates) {
      const feature = toGanttFeature(task);
      if (feature) items.push(feature);
    }
    items.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    return items;
  }, [tasksWithDates]);

  const taskByGanttId = useMemo(() => {
    const map = new Map<string, ProjectGanttTask>();
    for (const task of normalizedTasks) {
      map.set(task.ganttId, task);
    }
    return map;
  }, [normalizedTasks]);

  const groups = useMemo(
    () => buildWbsGroups(features, taskByGanttId),
    [features, taskByGanttId]
  );
  const [prevGroups, setPrevGroups] = useState(groups);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(groups.map((group) => group.name))
  );

  if (groups !== prevGroups) {
    setPrevGroups(groups);
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      for (const group of groups) {
        if (!next.has(group.name)) next.add(group.name);
      }
      return next;
    });
  }

  const handleMoveFeature = (id: string, startAt: Date, endAt: Date | null) => {
    onTaskMove?.(id, startAt, endAt);
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  };

  return (
    <div className={cn('overflow-hidden rounded-lg border', className)}>
      <div className="bg-muted/30 flex flex-wrap items-center gap-4 border-b px-4 py-2">
        {LEGEND_ITEMS.map((item) => (
          <div
            className="text-muted-foreground flex items-center gap-1.5 text-xs"
            key={item.label}
          >
            <span
              className={cn(
                item.marker ? 'h-3 w-0.5 rounded-none' : 'h-3 w-5 rounded-md'
              )}
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </div>
        ))}
        <Badge className="ml-auto" variant="secondary">
          {groups.length} WBS group{groups.length === 1 ? '' : 's'}
        </Badge>
      </div>

      <GanttProvider
        className="rounded-none border-0"
        range={range}
        zoom={zoom}
      >
        <GanttSidebar>
          {groups.map((group) => {
            const expanded = expandedGroups.has(group.name);
            return (
              <div className="border-border/40 border-b" key={group.name}>
                <button
                  className="flex w-full items-center gap-2 px-2.5 text-left"
                  onClick={() => toggleGroup(group.name)}
                  style={{ height: 'var(--gantt-row-height)' }}
                  type="button"
                >
                  {expanded ? (
                    <ChevronDown className="text-muted-foreground h-4 w-4" />
                  ) : (
                    <ChevronRight className="text-muted-foreground h-4 w-4" />
                  )}
                  <span className="truncate text-xs font-semibold">
                    {group.name}
                  </span>
                  <span className="text-muted-foreground ml-auto text-[10px]">
                    {group.done}/{group.total} · {group.progress}%
                  </span>
                </button>

                {expanded &&
                  group.features.map((feature) => (
                    <GanttSidebarItem
                      className="pl-7"
                      feature={feature}
                      key={feature.id}
                      onSelectItem={(id) => {
                        const task = taskByGanttId.get(id);
                        if (task) onTaskSelect?.(task);
                      }}
                    />
                  ))}
              </div>
            );
          })}
        </GanttSidebar>

        <GanttTimeline>
          <GanttHeader />
          <GanttFeatureList>
            {groups.map((group) => {
              const expanded = expandedGroups.has(group.name);
              return (
                <GanttFeatureListGroup key={group.name}>
                  {expanded &&
                    group.features.map((feature) => {
                      const task = taskByGanttId.get(feature.id);
                      if (!task) return null;
                      return (
                        <div className="flex" key={feature.id}>
                          <GanttFeatureItem
                            {...feature}
                            onMove={handleMoveFeature}
                          >
                            <FeatureCard
                              onSelectTask={onTaskSelect}
                              task={task}
                            />
                          </GanttFeatureItem>
                        </div>
                      );
                    })}
                </GanttFeatureListGroup>
              );
            })}
          </GanttFeatureList>

          {markers.map((marker) => (
            <GanttMarker
              {...marker}
              className="bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
              key={marker.id}
            />
          ))}
          <GanttToday className="bg-rose-500 text-white" />
          {onCreateMarker && (
            <GanttCreateMarkerTrigger onCreateMarker={onCreateMarker} />
          )}
        </GanttTimeline>
      </GanttProvider>

      {tasksWithoutDatesCount > 0 && (
        <div className="bg-muted/20 text-muted-foreground border-t px-4 py-2 text-xs">
          {tasksWithoutDatesCount} task(s) have no start/end dates and are not
          shown on the timeline.
        </div>
      )}
    </div>
  );
}

export type { GanttMarkerProps, Range } from '@/components/kibo-ui/gantt';
