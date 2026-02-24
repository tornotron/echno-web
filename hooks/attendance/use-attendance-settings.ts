'use client';

import { useState } from 'react';
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

export const blankShift: Omit<ShiftTiming, 'id'> = {
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

export const blankProfile: Omit<AttendanceProfile, 'id'> = {
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

// ─── Helper ───────────────────────────────────────────────────────────────────

export function getCycleLabel(cycles: number): string {
  const labels: Record<number, string> = {
    1: '1 — Check-in / Check-out',
    2: '2 — Full day with lunch break',
    3: '3 — Two-break day',
    4: '4 — Multi-cycle',
  };
  return labels[cycles] ?? `${cycles} cycles`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAttendanceSettings() {
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
      const newId = Math.max(0, ...profiles.map((p) => p.id ?? 0)) + 1;
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

  return {
    activeTab,
    setActiveTab,
    // Shift
    shifts,
    shiftDialogOpen,
    setShiftDialogOpen,
    editingShift,
    shiftForm,
    setShiftForm,
    openNewShift,
    openEditShift,
    saveShift,
    duplicateShift,
    // Profile
    profiles,
    profileDialogOpen,
    setProfileDialogOpen,
    editingProfile,
    profileForm,
    setProfileForm,
    openNewProfile,
    openEditProfile,
    saveProfile,
    // Delete
    deleteDialogOpen,
    setDeleteDialogOpen,
    deleteTarget,
    setDeleteTarget,
    confirmDelete,
  };
}
