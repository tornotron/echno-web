import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, MoreHorizontal, Copy } from 'lucide-react';
import type { ShiftTiming } from '@/types/attendance';

interface ShiftTimingsProps {
  shifts: ShiftTiming[];
  openNewShift: () => void;
  openEditShift: (shift: ShiftTiming) => void;
  duplicateShift: (shift: ShiftTiming) => void;
  setDeleteTarget: (target: {
    type: 'shift' | 'profile';
    id: number;
    name: string;
  }) => void;
  setDeleteDialogOpen: (open: boolean) => void;
}

export function ShiftTimings({
  shifts,
  openNewShift,
  openEditShift,
  duplicateShift,
  setDeleteTarget,
  setDeleteDialogOpen,
}: ShiftTimingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Shift Timings
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Define shift templates that can be assigned to attendance profiles
            and employees.
          </p>
        </div>
        <Button onClick={openNewShift}>
          <Plus className="mr-2 h-4 w-4" />
          New Shift
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Lunch</TableHead>
              <TableHead className="hidden sm:table-cell">Grace</TableHead>
              <TableHead className="hidden md:table-cell">Min Work</TableHead>
              <TableHead className="hidden md:table-cell">Overtime</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts
              .filter(
                (shift): shift is ShiftTiming & { id: number } =>
                  shift.id !== undefined
              )
              .map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">
                    {shift.shiftName}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">
                    {shift.startTime} – {shift.endTime}
                  </TableCell>
                  <TableCell className="text-zinc-600 dark:text-zinc-400">
                    {shift.lunchBreakStart} – {shift.lunchBreakEnd}
                  </TableCell>
                  <TableCell className="hidden text-zinc-600 sm:table-cell dark:text-zinc-400">
                    {shift.gracePeriodMinutes} min
                  </TableCell>
                  <TableCell className="hidden text-zinc-600 md:table-cell dark:text-zinc-400">
                    {shift.minimumWorkHours} h
                  </TableCell>
                  <TableCell className="hidden text-zinc-600 md:table-cell dark:text-zinc-400">
                    {shift.overtimeThreshold} h
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditShift(shift)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateShift(shift)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setDeleteTarget({
                              type: 'shift',
                              id: shift.id,
                              name: shift.shiftName,
                            });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
