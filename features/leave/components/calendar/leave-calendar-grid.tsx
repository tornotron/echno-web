/**
 * components/leave/calendar/leave-calendar-grid.tsx
 *
 * Interactive calendar grid for leave management with month/week/day views
 */

'use client';

import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  startOfDay,
  parseISO,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LeaveCalendarEntry, LeaveStatus } from '@/types/leave';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeaveStatusBadge } from '@/features/leave/components/leave-status-badge';

export type CalendarView = 'month' | 'week' | 'day';

interface LeaveCalendarGridProps {
  entries: LeaveCalendarEntry[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  view?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
}

export function LeaveCalendarGrid({
  entries,
  currentDate,
  onDateChange,
  view = 'month',
  onViewChange,
}: LeaveCalendarGridProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Group entries by date
  const entriesByDate: Record<string, LeaveCalendarEntry[]> = {};
  for (const entry of entries) {
    const date =
      typeof entry.leaveDate === 'string'
        ? parseISO(entry.leaveDate)
        : entry.leaveDate;
    const dateKey = format(startOfDay(date), 'yyyy-MM-dd');
    if (!entriesByDate[dateKey]) {
      entriesByDate[dateKey] = [];
    }
    entriesByDate[dateKey].push(entry);
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleCloseDialog = () => {
    setSelectedDate(null);
  };

  const selectedDateEntries = selectedDate
    ? entriesByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate =
                    view === 'month'
                      ? subMonths(currentDate, 1)
                      : view === 'week'
                        ? addDays(currentDate, -7)
                        : addDays(currentDate, -1);
                  onDateChange(newDate);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onDateChange(new Date())}
              >
                Today
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate =
                    view === 'month'
                      ? addMonths(currentDate, 1)
                      : view === 'week'
                        ? addDays(currentDate, 7)
                        : addDays(currentDate, 1);
                  onDateChange(newDate);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Current Date Display */}
            <div className="flex items-center gap-2">
              <CalendarIcon className="text-muted-foreground h-4 w-4" />
              <CardTitle className="text-lg">
                {view === 'month' && format(currentDate, 'MMMM yyyy')}
                {view === 'week' &&
                  `${format(startOfWeek(currentDate), 'MMM dd')} - ${format(endOfWeek(currentDate), 'MMM dd, yyyy')}`}
                {view === 'day' && format(currentDate, 'EEEE, MMMM dd, yyyy')}
              </CardTitle>
            </div>

            {/* View Switcher */}
            {onViewChange && (
              <Tabs
                value={view}
                onValueChange={(v) => onViewChange(v as CalendarView)}
              >
                <TabsList>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="day">Day</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              entriesByDate={entriesByDate}
              onDateClick={handleDateClick}
            />
          )}
          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              entriesByDate={entriesByDate}
              onDateClick={handleDateClick}
            />
          )}
          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              entries={entriesByDate[format(currentDate, 'yyyy-MM-dd')] || []}
            />
          )}
        </CardContent>
      </Card>

      {/* Leave Details Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, 'EEEE, MMMM dd, yyyy')}
            </DialogTitle>
            <DialogDescription>
              {selectedDateEntries.length === 0
                ? 'No employees on leave'
                : `${selectedDateEntries.length} ${selectedDateEntries.length === 1 ? 'employee' : 'employees'} on leave`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {selectedDateEntries.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                No leave entries for this date
              </div>
            ) : (
              selectedDateEntries.map((entry, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold">{entry.employeeName}</p>
                        {entry.department && (
                          <p className="text-muted-foreground text-sm">
                            {entry.department}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline">{entry.leaveTypeName}</Badge>
                          {entry.halfDayType &&
                            entry.halfDayType !== 'FULL_DAY' && (
                              <Badge variant="secondary">
                                {entry.halfDayType === 'FIRST_HALF'
                                  ? 'First Half'
                                  : 'Second Half'}
                              </Badge>
                            )}
                        </div>
                      </div>
                      <LeaveStatusBadge status={entry.status as LeaveStatus} />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MonthView({
  currentDate,
  entriesByDate,
  onDateClick,
}: {
  currentDate: Date;
  entriesByDate: Record<string, LeaveCalendarEntry[]>;
  onDateClick: (date: Date) => void;
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = 'd';
  const rows = [];
  let days = [];
  let day = startDate;

  // Week day headers
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    weekDays.push(
      <div
        key={i}
        className="text-muted-foreground py-2 text-center text-sm font-semibold"
      >
        {format(addDays(startDate, i), 'EEE')}
      </div>
    );
  }

  // Generate calendar grid
  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const formattedDate = format(day, 'yyyy-MM-dd');
      const dayEntries = entriesByDate[formattedDate] || [];
      const cloneDay = day;

      days.push(
        <div
          key={day.toString()}
          className={cn(
            'hover:bg-muted/50 min-h-16 cursor-pointer border p-1 transition-colors sm:min-h-24 sm:p-2',
            !isSameMonth(day, monthStart) &&
              'bg-muted/20 text-muted-foreground',
            isToday(day) && 'bg-primary/5 border-primary'
          )}
          onClick={() => onDateClick(cloneDay)}
        >
          <div className="flex items-start justify-between">
            <span
              className={cn(
                'text-sm font-medium',
                isToday(day) &&
                  'bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full'
              )}
            >
              {format(day, dateFormat)}
            </span>
            {dayEntries.length > 0 && (
              <Badge variant="secondary" className="h-5 text-xs">
                {dayEntries.length}
              </Badge>
            )}
          </div>

          {/* Show up to 3 entries - hidden on very small screens */}
          <div className="mt-1 hidden space-y-0.5 sm:block">
            {dayEntries.slice(0, 3).map((entry, idx) => (
              <div
                key={idx}
                className="bg-primary/10 text-primary truncate rounded-sm px-1 text-xs"
              >
                {entry.employeeName?.split(' ')[0]}
              </div>
            ))}
            {dayEntries.length > 3 && (
              <div className="text-muted-foreground text-xs">
                +{dayEntries.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toString()} className="grid grid-cols-7">
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div>
      <div className="grid grid-cols-7">{weekDays}</div>
      {rows}
    </div>
  );
}

function WeekView({
  currentDate,
  entriesByDate,
  onDateClick,
}: {
  currentDate: Date;
  entriesByDate: Record<string, LeaveCalendarEntry[]>;
  onDateClick: (date: Date) => void;
}) {
  const weekStart = startOfWeek(currentDate);
  const days = [];

  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i);
    const formattedDate = format(day, 'yyyy-MM-dd');
    const dayEntries = entriesByDate[formattedDate] || [];

    days.push(
      <div
        key={i}
        className={cn(
          'hover:bg-muted/50 min-h-32 cursor-pointer border p-3 transition-colors',
          isToday(day) && 'bg-primary/5 border-primary'
        )}
        onClick={() => onDateClick(day)}
      >
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-muted-foreground text-xs">
              {format(day, 'EEE')}
            </div>
            <div
              className={cn(
                'text-lg font-semibold',
                isToday(day) && 'text-primary'
              )}
            >
              {format(day, 'd')}
            </div>
          </div>
          {dayEntries.length > 0 && (
            <Badge variant="secondary">{dayEntries.length}</Badge>
          )}
        </div>

        <div className="space-y-1">
          {dayEntries.slice(0, 4).map((entry, idx) => (
            <div
              key={idx}
              className="bg-primary/10 text-primary truncate rounded-sm px-2 py-1 text-xs"
            >
              {entry.employeeName}
            </div>
          ))}
          {dayEntries.length > 4 && (
            <div className="text-muted-foreground text-center text-xs">
              +{dayEntries.length - 4} more
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div className="grid grid-cols-7 gap-px">{days}</div>;
}

function DayView({
  entries,
}: {
  currentDate: Date;
  entries: LeaveCalendarEntry[];
}) {
  if (entries.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        <CalendarIcon className="mx-auto mb-4 h-12 w-12 opacity-20" />
        <p>No employees on leave on this date</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-lg font-semibold">{entry.employeeName}</p>
                {entry.department && (
                  <p className="text-muted-foreground text-sm">
                    {entry.department}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline">{entry.leaveTypeName}</Badge>
                  {entry.halfDayType && entry.halfDayType !== 'FULL_DAY' && (
                    <Badge variant="secondary">
                      {entry.halfDayType === 'FIRST_HALF'
                        ? 'First Half'
                        : 'Second Half'}
                    </Badge>
                  )}
                </div>
              </div>
              <LeaveStatusBadge status={entry.status as LeaveStatus} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
