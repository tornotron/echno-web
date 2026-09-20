'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
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
import { Textarea } from '@/components/shadcn/textarea';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  useHolidaysForYear,
  useWorkingWeek,
} from '@tornotron/echno-core/holidays/hooks';
import {
  DAYS_OF_WEEK,
  type DayOfWeek,
  type Holiday,
} from '@tornotron/echno-core/holidays/types';
import {
  useCreateHoliday,
  useDeleteHoliday,
  useUpdateHoliday,
  useUpdateWorkingWeek,
} from '@/hooks/leave/use-holiday-mutations';
import { ConfirmationDialog } from '@/features/leave/components/confirmation-dialog';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

interface HolidayFormState {
  holidayDate: string;
  name: string;
  description: string;
}

const emptyForm = (year: number): HolidayFormState => ({
  holidayDate: `${year}-01-01`,
  name: '',
  description: '',
});

function weekdayOf(holiday: Holiday): string {
  return holiday.holidayDate.toLocaleDateString(undefined, { weekday: 'long' });
}

/**
 * The organisation's holiday calendar for one year, with add, edit and
 * delete, plus the working-week setting. Both feed the leave deduction rule:
 * a day outside the working week or on this list is a non-working day.
 */
export function HolidaysManager() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const { data: holidays, isLoading } = useHolidaysForYear(year);
  const { data: workingWeek } = useWorkingWeek();

  const createMutation = useCreateHoliday();
  const updateMutation = useUpdateHoliday();
  const deleteMutation = useDeleteHoliday();
  const workingWeekMutation = useUpdateWorkingWeek();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [form, setForm] = useState<HolidayFormState>(() => emptyForm(year));
  const [deleting, setDeleting] = useState<Holiday | null>(null);

  const byMonth = useMemo(() => {
    const groups = new Map<number, Holiday[]>();
    for (const holiday of holidays ?? []) {
      const month = holiday.holidayDate.getMonth();
      groups.set(month, [...(groups.get(month) ?? []), holiday]);
    }
    return groups;
  }, [holidays]);

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(year));
    setDialogOpen(true);
  };

  const openEdit = (holiday: Holiday) => {
    setEditing(holiday);
    setForm({
      holidayDate: holiday.holidayDateIso,
      name: holiday.name,
      description: holiday.description ?? '',
    });
    setDialogOpen(true);
  };

  const submit = () => {
    const data = {
      holidayDate: form.holidayDate,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
    };
    if (editing) {
      updateMutation.mutate(
        { holidayId: editing.id, data },
        { onSuccess: closeDialog }
      );
    } else {
      createMutation.mutate(data, { onSuccess: closeDialog });
    }
  };

  const toggleDay = (day: DayOfWeek, checked: boolean) => {
    const current = new Set(workingWeek?.workingDays);
    if (checked) current.add(day);
    else current.delete(day);
    const next = DAYS_OF_WEEK.filter((d) => current.has(d));
    if (next.length === 0) return;
    workingWeekMutation.mutate({ workingDays: next });
  };

  const formValid =
    form.name.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(form.holidayDate);
  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Working Week</CardTitle>
          <CardDescription className="text-xs">
            Days outside the working week are not charged under the Exclude and
            Sandwich leave treatments. Monday to Friday until changed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {DAYS_OF_WEEK.map((day) => {
              const checked = workingWeek?.workingDays.includes(day) ?? false;
              return (
                <label
                  key={day}
                  htmlFor={`working-day-${day}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    id={`working-day-${day}`}
                    checked={checked}
                    disabled={!workingWeek || workingWeekMutation.isPending}
                    onCheckedChange={(value) => toggleDay(day, value === true)}
                  />
                  {DAY_LABELS[day]}
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">
                Holidays in {year}
              </CardTitle>
              <CardDescription className="text-xs">
                {holidays?.length ?? 0} declared. One holiday per date,
                organisation wide.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous year"
                onClick={() => setYear((y) => y - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-12 text-center text-sm font-medium">
                {year}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next year"
                onClick={() => setYear((y) => y + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Holiday
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (holidays?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="text-muted-foreground mb-4 h-12 w-12" />
              <p className="text-muted-foreground mb-2">
                No holidays declared for {year}
              </p>
              <p className="text-muted-foreground text-sm">
                Add the public and organisation holidays so leave requests
                across them are charged correctly.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Holiday</TableHead>
                  <TableHead className="hidden sm:table-cell">Note</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MONTHS.map((monthName, month) => {
                  const rows = byMonth.get(month);
                  if (!rows || rows.length === 0) return null;
                  return [
                    <TableRow key={`m-${month}`} className="bg-muted/40">
                      <TableCell colSpan={5} className="py-1.5">
                        <Badge variant="secondary">{monthName}</Badge>
                      </TableCell>
                    </TableRow>,
                    ...rows.map((holiday) => (
                      <TableRow key={holiday.id}>
                        <TableCell className="font-mono text-sm">
                          {holiday.holidayDateIso}
                        </TableCell>
                        <TableCell>{weekdayOf(holiday)}</TableCell>
                        <TableCell className="font-medium">
                          {holiday.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden text-sm sm:table-cell">
                          {holiday.description ?? ''}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Edit ${holiday.name}`}
                              onClick={() => openEdit(holiday)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Remove ${holiday.name}`}
                              onClick={() => setDeleting(holiday)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )),
                  ];
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit Holiday' : 'Add Holiday'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Change the date, name or note of this holiday.'
                : 'Declare a holiday for the whole organisation.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="holidayDate">Date</Label>
              <Input
                id="holidayDate"
                type="date"
                value={form.holidayDate}
                onChange={(e) =>
                  setForm({ ...form, holidayDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holidayName">Name</Label>
              <Input
                id="holidayName"
                maxLength={150}
                placeholder="Republic Day"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holidayDescription">Note (optional)</Label>
              <Textarea
                id="holidayDescription"
                rows={2}
                maxLength={500}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!formValid || saving}>
              {editing ? 'Save Changes' : 'Add Holiday'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Remove holiday"
        description={
          deleting
            ? `Remove ${deleting.name} (${deleting.holidayDateIso}) from the calendar? Leave already charged under it is not recalculated.`
            : ''
        }
        confirmLabel="Remove"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleting) return;
          deleteMutation.mutate(deleting.id, {
            onSuccess: () => setDeleting(null),
          });
        }}
      />
    </div>
  );
}
