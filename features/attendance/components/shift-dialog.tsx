import { Button } from '@/components/shadcn/button';
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
import { Separator } from '@/components/shadcn/separator';
import type { ShiftTiming } from '@/types/attendance';

interface ShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingShift: ShiftTiming | null;
  shiftForm: Omit<ShiftTiming, 'id'>;
  setShiftForm: React.Dispatch<React.SetStateAction<Omit<ShiftTiming, 'id'>>>;
  saveShift: () => void;
}

export function ShiftDialog({
  open,
  onOpenChange,
  editingShift,
  shiftForm,
  setShiftForm,
  saveShift,
}: ShiftDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingShift ? 'Edit Shift' : 'New Shift Timing'}
          </DialogTitle>
          <DialogDescription>
            Define start/end times, lunch break window, and work hour
            thresholds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="shift-name">Shift Name</Label>
            <Input
              id="shift-name"
              placeholder="e.g. Standard Day Shift"
              value={shiftForm.shiftName}
              onChange={(e) =>
                setShiftForm((f) => ({ ...f, shiftName: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={shiftForm.startTime}
                onChange={(e) =>
                  setShiftForm((f) => ({ ...f, startTime: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={shiftForm.endTime}
                onChange={(e) =>
                  setShiftForm((f) => ({ ...f, endTime: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lunch-start">Lunch Break Start</Label>
              <Input
                id="lunch-start"
                type="time"
                value={shiftForm.lunchBreakStart}
                onChange={(e) =>
                  setShiftForm((f) => ({
                    ...f,
                    lunchBreakStart: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lunch-end">Lunch Break End</Label>
              <Input
                id="lunch-end"
                type="time"
                value={shiftForm.lunchBreakEnd}
                onChange={(e) =>
                  setShiftForm((f) => ({
                    ...f,
                    lunchBreakEnd: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grace-period">Grace Period (min)</Label>
              <Input
                id="grace-period"
                type="number"
                min={0}
                max={120}
                value={shiftForm.gracePeriodMinutes}
                onChange={(e) =>
                  setShiftForm((f) => ({
                    ...f,
                    gracePeriodMinutes: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-hours">Min Work Hours</Label>
              <Input
                id="min-hours"
                type="number"
                min={1}
                max={24}
                step={0.5}
                value={shiftForm.minimumWorkHours}
                onChange={(e) =>
                  setShiftForm((f) => ({
                    ...f,
                    minimumWorkHours: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="half-day-hours">Half-Day Hours</Label>
              <Input
                id="half-day-hours"
                type="number"
                min={1}
                max={12}
                step={0.5}
                value={shiftForm.halfDayWorkHours}
                onChange={(e) =>
                  setShiftForm((f) => ({
                    ...f,
                    halfDayWorkHours: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ot-threshold">Overtime After (h)</Label>
              <Input
                id="ot-threshold"
                type="number"
                min={1}
                max={24}
                step={0.5}
                value={shiftForm.overtimeThreshold}
                onChange={(e) =>
                  setShiftForm((f) => ({
                    ...f,
                    overtimeThreshold: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={saveShift}>
            {editingShift ? 'Save Changes' : 'Create Shift'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
