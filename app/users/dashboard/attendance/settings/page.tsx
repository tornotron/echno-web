'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  Plus,
  Settings,
  Edit,
  Trash2,
  MoreHorizontal,
  Camera,
  MapPin,
  Route,
  ShieldCheck,
  RefreshCw,
  AlarmClock,
  Copy,
} from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import type { ShiftTiming, AttendanceProfile } from '@/types/attendance';

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockShifts: ShiftTiming[] = [
  {
    id: 1,
    shiftName: 'Standard Day Shift',
    startTime: '09:00',
    endTime: '18:00',
    lunchBreakStart: '13:00',
    lunchBreakEnd: '14:00',
    gracePeriodMinutes: 15,
    minimumWorkHours: 8,
    halfDayWorkHours: 4,
    overtimeThreshold: 9,
  },
  {
    id: 2,
    shiftName: 'Early Morning Shift',
    startTime: '07:00',
    endTime: '16:00',
    lunchBreakStart: '12:00',
    lunchBreakEnd: '13:00',
    gracePeriodMinutes: 10,
    minimumWorkHours: 8,
    halfDayWorkHours: 4,
    overtimeThreshold: 9,
  },
  {
    id: 3,
    shiftName: 'Field Work Shift',
    startTime: '08:00',
    endTime: '17:00',
    lunchBreakStart: '13:00',
    lunchBreakEnd: '14:00',
    gracePeriodMinutes: 30,
    minimumWorkHours: 7,
    halfDayWorkHours: 3.5,
    overtimeThreshold: 8,
  },
];

const mockProfiles: AttendanceProfile[] = [
  {
    id: 1,
    settingName: 'Default Organization Policy',
    checkInOutCycles: 2,
    photoRequiredOnCheckIn: true,
    photoRequiredOnCheckOut: false,
    geolocationRequired: true,
    geofenceRadiusMeters: 100,
    movementTrackingEnabled: true,
    movementPhotoRequired: false,
    movementGeolocationRequired: false,
    autoMarkAbsentAfterHours: 4,
    allowSelfRegularization: true,
    regularizationApprovalRequired: true,
    maxRegularizationDaysPerMonth: 3,
    defaultShiftId: 1,
    isActive: true,
  },
  {
    id: 2,
    settingName: 'Site Field Workers Policy',
    projectId: 101,
    projectName: 'Sunrise Tower',
    checkInOutCycles: 2,
    photoRequiredOnCheckIn: true,
    photoRequiredOnCheckOut: true,
    geolocationRequired: true,
    geofenceRadiusMeters: 200,
    movementTrackingEnabled: true,
    movementPhotoRequired: true,
    movementGeolocationRequired: true,
    autoMarkAbsentAfterHours: 3,
    allowSelfRegularization: false,
    regularizationApprovalRequired: true,
    maxRegularizationDaysPerMonth: 1,
    defaultShiftId: 3,
    isActive: true,
  },
];

// ─── Blank form defaults ──────────────────────────────────────────────────────

const blankShift: Omit<ShiftTiming, 'id'> = {
  shiftName: '',
  startTime: '09:00',
  endTime: '18:00',
  lunchBreakStart: '13:00',
  lunchBreakEnd: '14:00',
  gracePeriodMinutes: 15,
  minimumWorkHours: 8,
  halfDayWorkHours: 4,
  overtimeThreshold: 9,
};

const blankProfile: Omit<AttendanceProfile, 'id'> = {
  settingName: '',
  checkInOutCycles: 2,
  photoRequiredOnCheckIn: true,
  photoRequiredOnCheckOut: false,
  geolocationRequired: true,
  geofenceRadiusMeters: 100,
  movementTrackingEnabled: true,
  movementPhotoRequired: false,
  movementGeolocationRequired: false,
  autoMarkAbsentAfterHours: 4,
  allowSelfRegularization: true,
  regularizationApprovalRequired: true,
  maxRegularizationDaysPerMonth: 3,
  isActive: true,
};

// ─── Cycle label helper ───────────────────────────────────────────────────────

function getCycleLabel(cycles: number): string {
  const labels: Record<number, string> = {
    1: '1 — Check-in / Check-out',
    2: '2 — Full day with lunch break',
    3: '3 — Two-break day',
    4: '4 — Multi-cycle',
  };
  return labels[cycles] ?? `${cycles} cycles`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AttendanceSettingsPage() {
  const [activeTab, setActiveTab] = useState<'shifts' | 'profiles'>('profiles');

  // ── Shift state ──────────────────────────────────────────────────────────
  const [shifts, setShifts] = useState<ShiftTiming[]>(mockShifts);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftTiming | null>(null);
  const [shiftForm, setShiftForm] =
    useState<Omit<ShiftTiming, 'id'>>(blankShift);

  // ── Profile state ────────────────────────────────────────────────────────
  const [profiles, setProfiles] = useState<AttendanceProfile[]>(mockProfiles);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] =
    useState<AttendanceProfile | null>(null);
  const [profileForm, setProfileForm] =
    useState<Omit<AttendanceProfile, 'id'>>(blankProfile);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'shift' | 'profile';
    id: number;
    name: string;
  } | null>(null);

  const tabs = [
    { id: 'profiles', label: 'Attendance Profiles', icon: Settings },
    { id: 'shifts', label: 'Shift Timings', icon: Clock },
  ];

  // ── Shift handlers ───────────────────────────────────────────────────────

  function openNewShift() {
    setEditingShift(null);
    setShiftForm(blankShift);
    setShiftDialogOpen(true);
  }

  function openEditShift(shift: ShiftTiming) {
    setEditingShift(shift);
    const { id: _id, ...rest } = shift;
    void _id;
    setShiftForm(rest);
    setShiftDialogOpen(true);
  }

  function saveShift() {
    if (!shiftForm.shiftName.trim()) {
      toast.error('Shift name is required');
      return;
    }
    if (editingShift) {
      setShifts((prev) =>
        prev.map((s) =>
          s.id === editingShift.id ? { ...shiftForm, id: editingShift.id } : s
        )
      );
      toast.success('Shift updated', {
        description: shiftForm.shiftName,
      });
    } else {
      const newId = Math.max(0, ...shifts.map((s) => s.id ?? 0)) + 1;
      setShifts((prev) => [...prev, { ...shiftForm, id: newId }]);
      toast.success('Shift created', {
        description: shiftForm.shiftName,
      });
    }
    setShiftDialogOpen(false);
  }

  function duplicateShift(shift: ShiftTiming) {
    const newId = Math.max(0, ...shifts.map((s) => s.id ?? 0)) + 1;
    setShifts((prev) => [
      ...prev,
      { ...shift, id: newId, shiftName: `${shift.shiftName} (Copy)` },
    ]);
    toast.success('Shift duplicated');
  }

  // ── Profile handlers ─────────────────────────────────────────────────────

  function openNewProfile() {
    setEditingProfile(null);
    setProfileForm(blankProfile);
    setProfileDialogOpen(true);
  }

  function openEditProfile(profile: AttendanceProfile) {
    setEditingProfile(profile);
    const { id: _id, ...rest } = profile;
    void _id;
    setProfileForm(rest);
    setProfileDialogOpen(true);
  }

  function saveProfile() {
    if (!profileForm.settingName.trim()) {
      toast.error('Profile name is required');
      return;
    }
    if (editingProfile) {
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === editingProfile.id
            ? { ...profileForm, id: editingProfile.id }
            : p
        )
      );
      toast.success('Profile updated', {
        description: profileForm.settingName,
      });
    } else {
      const newId = Math.max(0, ...profiles.map((p) => p.id)) + 1;
      setProfiles((prev) => [...prev, { ...profileForm, id: newId }]);
      toast.success('Profile created', {
        description: profileForm.settingName,
      });
    }
    setProfileDialogOpen(false);
  }

  // ── Delete handler ───────────────────────────────────────────────────────

  function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'shift') {
      setShifts((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    } else {
      setProfiles((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    }
    toast.success('Deleted', { description: deleteTarget.name });
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Attendance Settings
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Configure attendance rules, shift templates, and verification
              requirements for your organization.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center space-x-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── Attendance Profiles tab ─────────────────────────────────────── */}
      {activeTab === 'profiles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Attendance Profiles
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Organization-wide defaults and per-project overrides. A
                project-specific profile takes priority over the org default.
              </p>
            </div>
            <Button onClick={openNewProfile}>
              <Plus className="mr-2 h-4 w-4" />
              New Profile
            </Button>
          </div>

          <div className="grid gap-4">
            {profiles.map((profile) => (
              <Card
                key={profile.id}
                className="border-zinc-200 dark:border-zinc-800"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">
                          {profile.settingName}
                        </CardTitle>
                        {profile.projectName ? (
                          <Badge
                            variant="outline"
                            className="border-blue-300 text-blue-700 dark:text-blue-400"
                          >
                            {profile.projectName}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-zinc-300 text-zinc-600 dark:text-zinc-400"
                          >
                            Org Default
                          </Badge>
                        )}
                        {!profile.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        {getCycleLabel(profile.checkInOutCycles)} ·{' '}
                        {
                          shifts.find((s) => s.id === profile.defaultShiftId)
                            ?.shiftName
                        }
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEditProfile(profile)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setDeleteTarget({
                              type: 'profile',
                              id: profile.id,
                              name: profile.settingName,
                            });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {/* Check-in cycles */}
                    <FeaturePill
                      icon={<RefreshCw className="h-3.5 w-3.5" />}
                      label="Check-in cycles"
                      value={String(profile.checkInOutCycles)}
                      active
                    />
                    {/* Photo */}
                    <FeaturePill
                      icon={<Camera className="h-3.5 w-3.5" />}
                      label="Photo on check-in"
                      active={profile.photoRequiredOnCheckIn}
                    />
                    <FeaturePill
                      icon={<Camera className="h-3.5 w-3.5" />}
                      label="Photo on check-out"
                      active={profile.photoRequiredOnCheckOut}
                    />
                    {/* Geolocation */}
                    <FeaturePill
                      icon={<MapPin className="h-3.5 w-3.5" />}
                      label={`Geofence ${profile.geofenceRadiusMeters}m`}
                      active={profile.geolocationRequired}
                    />
                    {/* Movements */}
                    <FeaturePill
                      icon={<Route className="h-3.5 w-3.5" />}
                      label="Movement tracking"
                      active={profile.movementTrackingEnabled}
                    />
                    {/* Regularization */}
                    <FeaturePill
                      icon={<ShieldCheck className="h-3.5 w-3.5" />}
                      label="Self-regularization"
                      active={profile.allowSelfRegularization}
                    />
                    <FeaturePill
                      icon={<ShieldCheck className="h-3.5 w-3.5" />}
                      label={`Max ${profile.maxRegularizationDaysPerMonth} reg/mo`}
                      active
                    />
                    {/* Auto absent */}
                    <FeaturePill
                      icon={<AlarmClock className="h-3.5 w-3.5" />}
                      label={`Auto-absent ${profile.autoMarkAbsentAfterHours}h`}
                      active
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Shift Timings tab ───────────────────────────────────────────── */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Shift Timings
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Define shift templates that can be assigned to attendance
                profiles and employees.
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
                  <TableHead className="hidden md:table-cell">
                    Min Work
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Overtime
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => (
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditShift(shift)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => duplicateShift(shift)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setDeleteTarget({
                                type: 'shift',
                                id: shift.id!,
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
      )}

      {/* ── Shift Dialog ────────────────────────────────────────────────── */}
      <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
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
            <Button variant="outline" onClick={() => setShiftDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveShift}>
              {editingShift ? 'Save Changes' : 'Create Shift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Profile Dialog ───────────────────────────────────────────────── */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
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
                  Verify employee location against the project site when
                  clocking.
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
                    className="max-w-[160px]"
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
                    <Label htmlFor="max-reg">
                      Max Regularizations per Month
                    </Label>
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
                      className="max-w-[160px]"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="auto-absent">
                  Auto-mark Absent After (hours)
                </Label>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Hours past shift start before the system automatically marks
                  an employee absent if they haven&apos;t clocked in.
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
                  className="max-w-[160px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProfileDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveProfile}>
              {editingProfile ? 'Save Changes' : 'Create Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Delete {deleteTarget?.type === 'shift' ? 'Shift' : 'Profile'}?
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium">{deleteTarget?.name}</span> will be
              permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeaturePill({
  icon,
  label,
  value,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
        active
          ? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
          : 'bg-zinc-50 text-zinc-400 line-through dark:bg-zinc-900 dark:text-zinc-600'
      }`}
    >
      <span className={active ? 'text-zinc-500 dark:text-zinc-400' : ''}>
        {icon}
      </span>
      <span>
        {label}
        {value && active && (
          <span className="ml-1 font-semibold text-zinc-900 dark:text-zinc-100">
            {value}
          </span>
        )}
      </span>
    </div>
  );
}

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
