import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { getCycleLabel } from '../../../hooks/attendance/use-attendance-settings';
import type { ShiftTiming, AttendanceProfile } from '@/types/attendance';

// ─── Sub-component ────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProfile: AttendanceProfile | null;
  profileForm: Omit<AttendanceProfile, 'id'>;
  setProfileForm: React.Dispatch<
    React.SetStateAction<Omit<AttendanceProfile, 'id'>>
  >;
  saveProfile: () => void;
  shifts: ShiftTiming[];
}

export function ProfileDialog({
  open,
  onOpenChange,
  editingProfile,
  profileForm,
  setProfileForm,
  saveProfile,
  shifts,
}: ProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingProfile ? 'Edit Profile' : 'New Attendance Profile'}
          </DialogTitle>
          <DialogDescription>
            Configure attendance rules for your organization or a specific
            project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* General */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              General
            </h4>
            <div className="space-y-2">
              <Label htmlFor="profile-name">Profile Name</Label>
              <Input
                id="profile-name"
                placeholder="e.g. Default Organization Policy"
                value={profileForm.settingName}
                onChange={(e) =>
                  setProfileForm((f) => ({
                    ...f,
                    settingName: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-shift">Default Shift</Label>
              <Select
                value={profileForm.defaultShiftId?.toString() ?? ''}
                onValueChange={(v) =>
                  setProfileForm((f) => ({
                    ...f,
                    defaultShiftId: Number(v),
                  }))
                }
              >
                <SelectTrigger id="default-shift">
                  <SelectValue placeholder="Select a shift template" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((s) => (
                    <SelectItem key={s.id} value={s.id!.toString()}>
                      {s.shiftName} ({s.startTime} – {s.endTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Check-in / Check-out cycles */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Check-in / Check-out Cycles
              </h4>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                How many check-in and check-out pairs are required per day.
              </p>
            </div>
            <Select
              value={profileForm.checkInOutCycles.toString()}
              onValueChange={(v) =>
                setProfileForm((f) => ({
                  ...f,
                  checkInOutCycles: Number(v),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {getCycleLabel(n)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Cycle visual guide */}
            <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400">
              {profileForm.checkInOutCycles === 1 && (
                <span>
                  Events: <strong>Morning Check-in</strong> →{' '}
                  <strong>Evening Check-out</strong>
                </span>
              )}
              {profileForm.checkInOutCycles === 2 && (
                <span>
                  Events: <strong>Morning Check-in</strong> →{' '}
                  <strong>Lunch Start</strong> → <strong>Lunch End</strong> →{' '}
                  <strong>Evening Check-out</strong>
                </span>
              )}
              {profileForm.checkInOutCycles >= 3 && (
                <span>
                  Extended multi-cycle tracking with additional break windows.
                </span>
              )}
            </div>
          </div>

          <Separator />

          {/* Photo requirements */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Photo Requirements
              </h4>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Require employees to take a selfie when clocking in or out.
              </p>
            </div>
            <ToggleRow
              label="Photo required on check-in"
              description="Employee must upload a selfie at clock-in."
              checked={profileForm.photoRequiredOnCheckIn}
              onCheckedChange={(v) =>
                setProfileForm((f) => ({ ...f, photoRequiredOnCheckIn: v }))
              }
            />
            <ToggleRow
              label="Photo required on check-out"
              description="Employee must upload a selfie at clock-out."
              checked={profileForm.photoRequiredOnCheckOut}
              onCheckedChange={(v) =>
                setProfileForm((f) => ({ ...f, photoRequiredOnCheckOut: v }))
              }
            />
          </div>

          <Separator />

          {/* Geolocation */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Geolocation
              </h4>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Verify employee location against the project site when clocking.
              </p>
            </div>
            <ToggleRow
              label="Geolocation required"
              description="GPS coordinates must be present in every clock event."
              checked={profileForm.geolocationRequired}
              onCheckedChange={(v) =>
                setProfileForm((f) => ({ ...f, geolocationRequired: v }))
              }
            />
            {profileForm.geolocationRequired && (
              <div className="space-y-2 pl-1">
                <Label htmlFor="geofence-radius">
                  Geofence Radius (meters)
                </Label>
                <Input
                  id="geofence-radius"
                  type="number"
                  min={50}
                  max={5000}
                  value={profileForm.geofenceRadiusMeters}
                  onChange={(e) =>
                    setProfileForm((f) => ({
                      ...f,
                      geofenceRadiusMeters: Number(e.target.value),
                    }))
                  }
                  className="max-w-40"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Movement tracking */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Movement Tracking
              </h4>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Allow employees to log daily movements (site travel, meetings,
                etc.).
              </p>
            </div>
            <ToggleRow
              label="Movement tracking enabled"
              description="Employees can log movements during the day."
              checked={profileForm.movementTrackingEnabled}
              onCheckedChange={(v) =>
                setProfileForm((f) => ({
                  ...f,
                  movementTrackingEnabled: v,
                  movementPhotoRequired: v ? f.movementPhotoRequired : false,
                  movementGeolocationRequired: v
                    ? f.movementGeolocationRequired
                    : false,
                }))
              }
            />
            {profileForm.movementTrackingEnabled && (
              <>
                <ToggleRow
                  label="Photo required for movements"
                  description="Employees must attach a proof photo for each movement."
                  checked={profileForm.movementPhotoRequired}
                  onCheckedChange={(v) =>
                    setProfileForm((f) => ({
                      ...f,
                      movementPhotoRequired: v,
                    }))
                  }
                />
                <ToggleRow
                  label="Geolocation required for movements"
                  description="GPS coordinates must be captured when logging a movement."
                  checked={profileForm.movementGeolocationRequired}
                  onCheckedChange={(v) =>
                    setProfileForm((f) => ({
                      ...f,
                      movementGeolocationRequired: v,
                    }))
                  }
                />
              </>
            )}
          </div>

          <Separator />

          {/* Regularization */}
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Regularization
              </h4>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Control how employees can request corrections for missed clock
                events.
              </p>
            </div>
            <ToggleRow
              label="Allow self-regularization"
              description="Employees can raise their own correction requests."
              checked={profileForm.allowSelfRegularization}
              onCheckedChange={(v) =>
                setProfileForm((f) => ({ ...f, allowSelfRegularization: v }))
              }
            />
            {profileForm.allowSelfRegularization && (
              <>
                <ToggleRow
                  label="Regularization requires approval"
                  description="A manager must approve regularization requests before they take effect."
                  checked={profileForm.regularizationApprovalRequired}
                  onCheckedChange={(v) =>
                    setProfileForm((f) => ({
                      ...f,
                      regularizationApprovalRequired: v,
                    }))
                  }
                />
                <div className="space-y-2 pl-1">
                  <Label htmlFor="max-reg">Max Regularizations per Month</Label>
                  <Input
                    id="max-reg"
                    type="number"
                    min={0}
                    max={31}
                    value={profileForm.maxRegularizationDaysPerMonth}
                    onChange={(e) =>
                      setProfileForm((f) => ({
                        ...f,
                        maxRegularizationDaysPerMonth: Number(e.target.value),
                      }))
                    }
                    className="max-w-40"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="auto-absent">
                Auto-mark Absent After (hours)
              </Label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Hours past shift start before the system automatically marks an
                employee absent if they haven&apos;t clocked in.
              </p>
              <Input
                id="auto-absent"
                type="number"
                min={1}
                max={24}
                value={profileForm.autoMarkAbsentAfterHours}
                onChange={(e) =>
                  setProfileForm((f) => ({
                    ...f,
                    autoMarkAbsentAfterHours: Number(e.target.value),
                  }))
                }
                className="max-w-40"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={saveProfile}>
            {editingProfile ? 'Save Changes' : 'Create Profile'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
