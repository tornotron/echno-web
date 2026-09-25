'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addMonths, format, getDay, isSameMonth, subMonths } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Textarea } from '@/components/shadcn/textarea';
import { toast } from '@/lib/styles/toast-styles';
import { cn } from '@/lib/utils/index';
import { getErrorMessage } from '@tornotron/echno-core';
import {
  useRegularizationCalendar,
  useRequestRegularizationByDate,
} from '@tornotron/echno-core/attendance-regularization/hooks';
import type {
  RegularizationCalendarDay,
  RegularizationCalendarState,
} from '@tornotron/echno-core/attendance/types';
import { useProjects } from '@tornotron/echno-core/project/hooks';

// ─── State presentation ───────────────────────────────────────────────────────

/** Label and cell colours per state. Actionable states are the loud ones. */
export const CALENDAR_STATE_STYLE: Record<
  RegularizationCalendarState,
  { label: string; cell: string; dot: string }
> = {
  MISSING: {
    label: 'Missing',
    cell: 'border-red-300 bg-red-50 text-red-900 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100',
    dot: 'bg-red-500',
  },
  INCOMPLETE: {
    label: 'Incomplete',
    cell: 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
    dot: 'bg-amber-500',
  },
  PENDING: {
    label: 'Pending',
    cell: 'border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100',
    dot: 'bg-blue-500',
  },
  REGULARIZED: {
    label: 'Regularized',
    cell: 'border-emerald-200 bg-emerald-50/60 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100',
    dot: 'bg-emerald-500',
  },
  COMPLETE: {
    label: 'Present',
    cell: 'border-transparent bg-zinc-100 text-zinc-400 dark:bg-zinc-800/60 dark:text-zinc-500',
    dot: 'bg-zinc-400',
  },
  LEAVE: {
    label: 'Leave',
    cell: 'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-100',
    dot: 'bg-violet-500',
  },
  LEAVE_PENDING: {
    label: 'Leave pending',
    cell: 'border-dashed border-violet-300 bg-violet-50/50 text-violet-900 dark:border-violet-800 dark:bg-violet-950/20 dark:text-violet-100',
    dot: 'bg-violet-300',
  },
  NON_WORKING: {
    label: 'Off day',
    cell: 'border-transparent bg-transparent text-zinc-400 hover:bg-zinc-50 dark:text-zinc-500 dark:hover:bg-zinc-900',
    dot: 'bg-zinc-200 dark:bg-zinc-700',
  },
  FUTURE: {
    label: 'Upcoming',
    cell: 'border-transparent bg-transparent text-zinc-300 dark:text-zinc-600',
    dot: 'bg-transparent border border-zinc-300 dark:border-zinc-600',
  },
};

const LEGEND: RegularizationCalendarState[] = [
  'MISSING',
  'INCOMPLETE',
  'PENDING',
  'REGULARIZED',
  'COMPLETE',
  'LEAVE',
  'LEAVE_PENDING',
  'NON_WORKING',
];

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Blank cells before the 1st, for a Monday-first grid. */
function leadingBlanks(firstDay: Date): number {
  return (getDay(firstDay) + 6) % 7;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RegularizationCalendar({
  employeeId,
}: {
  employeeId: number | undefined;
}) {
  const router = useRouter();
  const today = new Date();
  const [month, setMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const { data: days = [], isLoading } = useRegularizationCalendar(
    employeeId,
    month.getFullYear(),
    month.getMonth() + 1
  );

  const [selected, setSelected] = useState<RegularizationCalendarDay | null>(
    null
  );
  const [formOpen, setFormOpen] = useState(false);

  const blanks = days.length > 0 ? leadingBlanks(days[0].date) : 0;
  const needsAction = days.filter((d) =>
    ['MISSING', 'INCOMPLETE'].includes(d.state)
  ).length;
  const atCurrentMonth = isSameMonth(month, today);

  function onDayClick(day: RegularizationCalendarDay) {
    if (!day.actionable) return;
    setSelected(day);
  }

  function applyForLeave() {
    if (!selected) return;
    router.push(
      `/users/dashboard/attendance/my-leaves/apply?date=${selected.dateKey}`
    );
  }

  function regularize() {
    setFormOpen(true);
  }

  return (
    <Card className="gap-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-zinc-500" />
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            Attendance calendar
          </p>
          {!isLoading && needsAction > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
              {needsAction} {needsAction === 1 ? 'day needs' : 'days need'}{' '}
              action
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            aria-label="Previous month"
            onClick={() => setMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-32 text-center text-sm font-medium">
            {format(month, 'MMMM yyyy')}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            aria-label="Next month"
            disabled={atCurrentMonth}
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-3 sm:p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-zinc-400" />
            <p className="text-zinc-600 dark:text-zinc-400">Loading…</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="pb-1 text-center text-[11px] font-medium text-zinc-500 sm:text-xs"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: blanks }, (_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {days.map((day) => {
              const style = CALENDAR_STATE_STYLE[day.state];
              return (
                <button
                  key={day.dateKey}
                  type="button"
                  data-state={day.state}
                  disabled={!day.actionable}
                  onClick={() => onDayClick(day)}
                  title={`${format(day.date, 'EEE, dd MMM')}: ${style.label}`}
                  aria-label={`${format(day.date, 'd MMMM')}, ${style.label}`}
                  className={cn(
                    'flex aspect-square min-h-9 flex-col items-center justify-center rounded-md border text-xs transition-colors sm:min-h-14 sm:text-sm',
                    style.cell,
                    day.actionable
                      ? 'cursor-pointer font-semibold'
                      : 'cursor-default'
                  )}
                >
                  <span>{day.date.getDate()}</span>
                  <span
                    className={cn(
                      'mt-1 hidden size-1.5 rounded-full sm:block',
                      style.dot
                    )}
                  />
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          {LEGEND.map((state) => (
            <span key={state} className="flex items-center gap-1.5">
              <span
                className={cn(
                  'size-2 rounded-full',
                  CALENDAR_STATE_STYLE[state].dot
                )}
              />
              {CALENDAR_STATE_STYLE[state].label}
            </span>
          ))}
        </div>
      </CardContent>

      {/* Choose an action for the selected day */}
      <Dialog
        open={selected !== null && !formOpen}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selected ? format(selected.date, 'EEEE, dd MMM yyyy') : ''}
            </DialogTitle>
            <DialogDescription>
              What would you like to do for this date?
            </DialogDescription>
          </DialogHeader>
          {selected?.regularizationStatus === 'rejected' && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              Your last request for this day was rejected
              {selected.rejectionReason ? `: ${selected.rejectionReason}` : '.'}
            </p>
          )}
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Apply for leave if you were away. Regularize if you worked but your
            attendance was not recorded.
          </p>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={applyForLeave}>
              Apply for Leave
            </Button>
            <Button onClick={regularize}>Regularize Attendance</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selected && employeeId !== undefined && (
        <RegularizeByDateDialog
          open={formOpen}
          day={selected}
          employeeId={employeeId}
          onClose={() => {
            setFormOpen(false);
            setSelected(null);
          }}
        />
      )}
    </Card>
  );
}

// ─── Regularization form ──────────────────────────────────────────────────────

export function RegularizeByDateDialog({
  open,
  day,
  employeeId,
  onClose,
}: {
  open: boolean;
  day: RegularizationCalendarDay;
  employeeId: number;
  onClose: () => void;
}) {
  const { data: projects = [] } = useProjects();
  const mutation = useRequestRegularizationByDate();

  const [projectId, setProjectId] = useState<string>(
    day.projectId === undefined ? '' : String(day.projectId)
  );
  const [clockIn, setClockIn] = useState('09:00');
  const [clockOut, setClockOut] = useState('18:00');
  const [reason, setReason] = useState('');

  // A day with clock events keeps its project: the request completes that
  // record. A day with nothing recorded may be claimed on any project.
  const projectLocked =
    day.state === 'INCOMPLETE' && day.projectId !== undefined;
  const projectOptions = useMemo(() => {
    if (!projectLocked || projects.some((p) => p.id === day.projectId)) {
      return projects;
    }
    return [
      ...projects,
      { id: day.projectId!, projectName: day.projectName ?? 'Project' },
    ];
  }, [projects, projectLocked, day.projectId, day.projectName]);

  const timesInvalid = clockOut !== '' && clockOut <= clockIn;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      toast.error('Please choose the project you worked on');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please give a reason');
      return;
    }
    if (timesInvalid) {
      toast.error('Clock-out must be after clock-in');
      return;
    }
    mutation.mutate(
      {
        employeeId,
        projectId: Number(projectId),
        attendanceDate: day.date,
        reason: reason.trim(),
        clockInTime: clockIn,
        clockOutTime: clockOut || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Regularization request sent to your manager');
          onClose();
        },
        onError: (error) =>
          toast.error(
            getErrorMessage(error) || 'Failed to submit the regularization'
          ),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Regularize attendance</DialogTitle>
            <DialogDescription>
              {format(day.date, 'EEEE, dd MMM yyyy')}. Your manager approves the
              times before they are added to your attendance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reg-project">Project</Label>
            <Select
              value={projectId}
              onValueChange={setProjectId}
              disabled={projectLocked}
            >
              <SelectTrigger id="reg-project">
                <SelectValue placeholder="Select the project you worked on" />
              </SelectTrigger>
              <SelectContent>
                {projectOptions.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="reg-in">Clock-in</Label>
              <Input
                id="reg-in"
                type="time"
                required
                value={clockIn}
                onChange={(e) => setClockIn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-out">Clock-out</Label>
              <Input
                id="reg-out"
                type="time"
                value={clockOut}
                onChange={(e) => setClockOut(e.target.value)}
                aria-invalid={timesInvalid}
              />
            </div>
          </div>
          {timesInvalid && (
            <p className="text-destructive text-xs">
              Clock-out must be after clock-in.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="reg-reason">Reason</Label>
            <Textarea
              id="reg-reason"
              placeholder="Why was your attendance not recorded?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
