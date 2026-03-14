'use client';

import { useMemo, useRef, useState } from 'react';
import {
  format,
  differenceInDays,
  addDays,
  eachMonthOfInterval,
  endOfMonth,
} from 'date-fns';
import { Task, TaskStatus } from '@/types/task';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 56;
const LEFT_PANEL_WIDTH = 260;
const DAY_WIDTH = 24; // px per day (base)
const MIN_BAR_WIDTH = 4;

// ─── Types ────────────────────────────────────────────────────────────────────

interface GanttTask extends Task {
  isCritical?: boolean;
  isNearCritical?: boolean;
}

// ─── Critical Path Detection ──────────────────────────────────────────────────

function detectCriticalPath(tasks: Task[]): GanttTask[] {
  const withDates = tasks.filter((t) => t.startDate && t.endDate);
  if (withDates.length === 0) return tasks as GanttTask[];

  const projectEnd = new Date(
    Math.max(...withDates.map((t) => t.endDate!.getTime()))
  );
  const nearCriticalThreshold = addDays(projectEnd, -7);

  return tasks.map((t) => {
    if (!t.endDate) return { ...t } as GanttTask;
    const isCritical = t.endDate >= projectEnd;
    const isNearCritical = !isCritical && t.endDate >= nearCriticalThreshold;
    return { ...t, isCritical, isNearCritical } as GanttTask;
  });
}

// ─── Status color for bars ────────────────────────────────────────────────────

function barColor(task: GanttTask): {
  fill: string;
  progress: string;
  border: string;
} {
  if (task.isCritical) {
    return { fill: '#FEE2E2', progress: '#EF4444', border: '#EF4444' };
  }
  if (task.isNearCritical) {
    return { fill: '#FEF3C7', progress: '#F59E0B', border: '#F59E0B' };
  }
  switch (task.status) {
    case TaskStatus.completed: {
      return { fill: '#DCFCE7', progress: '#22C55E', border: '#22C55E' };
    }
    case TaskStatus.onGoing: {
      return { fill: '#DBEAFE', progress: '#3B82F6', border: '#3B82F6' };
    }
    case TaskStatus.onHold: {
      return { fill: '#FEF3C7', progress: '#F59E0B', border: '#F59E0B' };
    }
    default: {
      return { fill: '#F1F5F9', progress: '#94A3B8', border: '#94A3B8' };
    }
  }
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipState {
  task: GanttTask;
  clientX: number;
  clientY: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface GanttChartProps {
  tasks: Task[];
  /** Optional: project start date override */
  projectStart?: Date;
  /** Optional: project end date override */
  projectEnd?: Date;
}

export function GanttChart({
  tasks,
  projectStart,
  projectEnd,
}: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const ganttTasks = useMemo(() => detectCriticalPath(tasks), [tasks]);

  const tasksWithDates = ganttTasks.filter((t) => t.startDate && t.endDate);
  const tasksWithoutDates = ganttTasks.filter(
    (t) => !t.startDate || !t.endDate
  );

  const { start, end, totalDays } = useMemo(() => {
    const allDates = tasksWithDates.flatMap((t) => [t.startDate!, t.endDate!]);
    if (projectStart) allDates.push(projectStart);
    if (projectEnd) allDates.push(projectEnd);

    if (allDates.length === 0) {
      const s = new Date();
      const e = addDays(s, 30);
      return { start: s, end: e, totalDays: 30 };
    }

    const s = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const e = new Date(Math.max(...allDates.map((d) => d.getTime())));
    // Pad 2 days on each side
    const paddedStart = addDays(s, -2);
    const paddedEnd = addDays(e, 2);
    return {
      start: paddedStart,
      end: paddedEnd,
      totalDays: differenceInDays(paddedEnd, paddedStart) + 1,
    };
  }, [tasksWithDates, projectStart, projectEnd]);

  const svgWidth = totalDays * DAY_WIDTH;

  // Month header columns
  const months = useMemo(() => {
    if (totalDays === 0) return [];

    return eachMonthOfInterval({ start, end }).map((monthDate) => {
      const mStart = new Date(Math.max(monthDate.getTime(), start.getTime()));
      const mEnd = new Date(
        Math.min(endOfMonth(monthDate).getTime(), end.getTime())
      );

      const x = differenceInDays(mStart, start) * DAY_WIDTH;
      const width = (differenceInDays(mEnd, mStart) + 1) * DAY_WIDTH;

      return { label: format(monthDate, 'MMM yyyy'), x, width };
    });
  }, [start, end, totalDays]);

  // Week tick marks
  const weekTicks = useMemo(() => {
    const ticks: { x: number; label: string }[] = [];
    let cursor = start;
    while (cursor <= end) {
      const x = differenceInDays(cursor, start) * DAY_WIDTH;
      ticks.push({ x, label: format(cursor, 'd') });
      cursor = addDays(cursor, 7);
    }
    return ticks;
  }, [start, end]);

  // Today line
  const today = new Date();
  const todayX =
    today >= start && today <= end
      ? differenceInDays(today, start) * DAY_WIDTH
      : null;

  const allTasks = [...tasksWithDates, ...tasksWithoutDates];

  return (
    // Outer card is flex-col so the scroll container is a flex item.
    // Flex items with overflow != visible contribute 0 min-content to the
    // parent, preventing the SVG pixel width from propagating up to the page.
    <div className="flex w-full flex-col rounded-lg border border-zinc-200 dark:border-zinc-800">
      {/* Legend */}
      <div className="flex flex-none flex-wrap items-center gap-4 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <LegendItem color="#EF4444" label="Critical path" />
        <LegendItem color="#F59E0B" label="Near-critical" />
        <LegendItem color="#3B82F6" label="In progress" />
        <LegendItem color="#22C55E" label="Completed" />
        <LegendItem color="#94A3B8" label="Upcoming" />
        {todayX !== null && (
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <span className="inline-block h-3 w-0.5 bg-rose-500" />
            Today
          </span>
        )}
      </div>

      {/* Horizontally scrollable chart area — flex item with overflow-x-auto */}
      <div ref={scrollRef} className="min-w-0 overflow-x-auto">
        <div style={{ display: 'flex', minWidth: LEFT_PANEL_WIDTH + svgWidth }}>
          {/* ── Left Panel (sticky) ── */}
          <div
            className="sticky left-0 z-10 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            style={{ width: LEFT_PANEL_WIDTH }}
          >
            {/* Header */}
            <div
              className="flex items-end border-b border-zinc-200 bg-zinc-50 px-3 pb-2 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-900"
              style={{ height: HEADER_HEIGHT }}
            >
              Task
            </div>
            {/* Rows */}
            {allTasks.map((task, i) => (
              <div
                key={task.id ?? i}
                className="flex items-center border-b border-zinc-100 px-3 dark:border-zinc-800"
                style={{ height: ROW_HEIGHT }}
              >
                <div className="flex-1 truncate">
                  <span
                    className={`text-sm font-medium ${
                      task.isCritical
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                {task.isCritical && (
                  <span className="ml-1 shrink-0 rounded bg-red-100 px-1 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900 dark:text-red-300">
                    CP
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* ── Right Panel (SVG) ── */}
          <div style={{ width: svgWidth, flexShrink: 0 }}>
            <svg
              width={svgWidth}
              height={HEADER_HEIGHT + allTasks.length * ROW_HEIGHT}
              className="block"
            >
              {/* Month header background */}
              {months.map((m, i) => (
                <rect
                  key={i}
                  x={m.x}
                  y={0}
                  width={m.width}
                  height={HEADER_HEIGHT}
                  fill={i % 2 === 0 ? '#F8FAFC' : '#F1F5F9'}
                  className="dark:fill-zinc-900"
                />
              ))}
              {/* Month labels */}
              {months.map((m, i) => (
                <text
                  key={i}
                  x={m.x + m.width / 2}
                  y={20}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="#64748B"
                  className="dark:fill-zinc-400"
                >
                  {m.label}
                </text>
              ))}
              {/* Week ticks */}
              {weekTicks.map((tick, i) => (
                <g key={i}>
                  <line
                    x1={tick.x}
                    y1={34}
                    x2={tick.x}
                    y2={HEADER_HEIGHT}
                    stroke="#CBD5E1"
                    strokeWidth={0.5}
                  />
                  <text
                    x={tick.x + 2}
                    y={HEADER_HEIGHT - 4}
                    fontSize={10}
                    fill="#94A3B8"
                  >
                    {tick.label}
                  </text>
                </g>
              ))}
              {/* Header border */}
              <line
                x1={0}
                y1={HEADER_HEIGHT}
                x2={svgWidth}
                y2={HEADER_HEIGHT}
                stroke="#E2E8F0"
                strokeWidth={1}
              />

              {/* Task rows */}
              {allTasks.map((task, i) => {
                const y = HEADER_HEIGHT + i * ROW_HEIGHT;
                const colors = barColor(task);

                // Vertical grid line per week
                return (
                  <g key={task.id ?? i}>
                    {/* Row background (alternating) */}
                    <rect
                      x={0}
                      y={y}
                      width={svgWidth}
                      height={ROW_HEIGHT}
                      fill={i % 2 === 0 ? 'white' : '#F8FAFC'}
                      className="dark:fill-zinc-950"
                    />
                    <line
                      x1={0}
                      y1={y + ROW_HEIGHT}
                      x2={svgWidth}
                      y2={y + ROW_HEIGHT}
                      stroke="#F1F5F9"
                      strokeWidth={0.5}
                    />

                    {/* Bar */}
                    {task.startDate &&
                      task.endDate &&
                      (() => {
                        const barX =
                          differenceInDays(task.startDate, start) * DAY_WIDTH;
                        const barWidth = Math.max(
                          MIN_BAR_WIDTH,
                          (differenceInDays(task.endDate, task.startDate) + 1) *
                            DAY_WIDTH
                        );
                        const barY = y + ROW_HEIGHT / 2 - 10;
                        const barH = 20;
                        const progressWidth = (task.progress / 100) * barWidth;

                        return (
                          <g
                            onMouseEnter={(e) =>
                              setTooltip({
                                task,
                                clientX: e.clientX,
                                clientY: e.clientY,
                              })
                            }
                            onMouseMove={(e) =>
                              setTooltip({
                                task,
                                clientX: e.clientX,
                                clientY: e.clientY,
                              })
                            }
                            onMouseLeave={() => setTooltip(null)}
                            style={{ cursor: 'pointer' }}
                          >
                            {/* Bar background */}
                            <rect
                              x={barX}
                              y={barY}
                              width={barWidth}
                              height={barH}
                              rx={3}
                              fill={colors.fill}
                              stroke={colors.border}
                              strokeWidth={task.isCritical ? 1.5 : 0.5}
                            />
                            {/* Progress fill */}
                            {progressWidth > 0 && (
                              <rect
                                x={barX}
                                y={barY}
                                width={progressWidth}
                                height={barH}
                                rx={3}
                                fill={colors.progress}
                                opacity={0.7}
                              />
                            )}
                            {/* Progress label inside bar */}
                            {barWidth > 40 && (
                              <text
                                x={barX + barWidth / 2}
                                y={barY + barH / 2 + 4}
                                textAnchor="middle"
                                fontSize={10}
                                fontWeight={600}
                                fill={task.isCritical ? '#B91C1C' : '#1E293B'}
                              >
                                {task.progress}%
                              </text>
                            )}
                          </g>
                        );
                      })()}

                    {/* No date placeholder */}
                    {(!task.startDate || !task.endDate) && (
                      <text
                        x={8}
                        y={y + ROW_HEIGHT / 2 + 4}
                        fontSize={11}
                        fill="#CBD5E1"
                        fontStyle="italic"
                      >
                        No dates set
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Today line */}
              {todayX !== null && (
                <g>
                  <line
                    x1={todayX}
                    y1={HEADER_HEIGHT}
                    x2={todayX}
                    y2={HEADER_HEIGHT + allTasks.length * ROW_HEIGHT}
                    stroke="#F43F5E"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                  />
                </g>
              )}

              {/* Tooltip */}
            </svg>
          </div>
        </div>
      </div>

      {/* Tasks without dates info */}
      {tasksWithoutDates.length > 0 && (
        <div className="flex-none border-t border-zinc-100 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {tasksWithoutDates.length} task(s) have no start/end dates and cannot
          be rendered on the timeline.
        </div>
      )}

      {/* Tooltip — fixed so it escapes overflow-x-auto clipping */}
      {tooltip && (
        <GanttTooltip
          task={tooltip.task}
          clientX={tooltip.clientX}
          clientY={tooltip.clientY}
        />
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
      <span
        className="inline-block h-3 w-5 rounded"
        style={{ background: color, opacity: 0.8 }}
      />
      {label}
    </span>
  );
}

const TOOLTIP_W = 220;

function GanttTooltip({
  task,
  clientX,
  clientY,
}: {
  task: GanttTask;
  clientX: number;
  clientY: number;
}) {
  // Keep tooltip inside the viewport
  const left = Math.min(clientX + 14, window.innerWidth - TOOLTIP_W - 8);
  const top = Math.max(clientY - 70, 8);

  return (
    <div
      className="pointer-events-none fixed z-50 w-[220px] rounded-lg border border-zinc-200 bg-white px-3 py-2.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
      style={{ left, top }}
    >
      <p className="mb-1 truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
        {task.title}
      </p>
      <p className="text-xs text-zinc-500">
        Progress:{' '}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {task.progress}%
        </span>
        {' · '}Status:{' '}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {task.status}
        </span>
      </p>
      {task.startDate && (
        <p className="mt-0.5 text-xs text-zinc-500">
          Start:{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {format(task.startDate, 'dd MMM yyyy')}
          </span>
        </p>
      )}
      {task.endDate && (
        <p className="mt-0.5 text-xs text-zinc-500">
          End:{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {format(task.endDate, 'dd MMM yyyy')}
          </span>
        </p>
      )}
      {(task.isCritical || task.isNearCritical) && (
        <p
          className={`mt-1 text-xs font-semibold ${task.isCritical ? 'text-red-500' : 'text-amber-500'}`}
        >
          {task.isCritical ? '⚠ On critical path' : '⚠ Near-critical'}
        </p>
      )}
    </div>
  );
}
