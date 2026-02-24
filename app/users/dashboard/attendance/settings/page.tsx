'use client';

import { Clock, Settings } from 'lucide-react';
import { useAttendanceSettings } from '@/hooks/attendance/use-attendance-settings';
import { ShiftTimings } from '@/features/attendance/components/shift-timings';
import { ShiftDialog } from '@/features/attendance/components/shift-dialog';
import { AttendanceProfiles } from '@/features/attendance/components/attendance-profiles';
import { ProfileDialog } from '@/features/attendance/components/profile-dialog';
import { DeleteConfirmDialog } from '@/features/attendance/components/delete-confirm-dialog';

// ─── Component ────────────────────────────────────────────────────────────────

const tabs = [
  { id: 'profiles', label: 'Attendance Profiles', icon: Settings },
  { id: 'shifts', label: 'Shift Timings', icon: Clock },
] as const;

export default function AttendanceSettingsPage() {
  const {
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
  } = useAttendanceSettings();

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
              onClick={() => setActiveTab(tab.id)}
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

      {/* Tab content */}
      {activeTab === 'profiles' && (
        <AttendanceProfiles
          profiles={profiles}
          shifts={shifts}
          openNewProfile={openNewProfile}
          openEditProfile={openEditProfile}
          setDeleteTarget={setDeleteTarget}
          setDeleteDialogOpen={setDeleteDialogOpen}
        />
      )}

      {activeTab === 'shifts' && (
        <ShiftTimings
          shifts={shifts}
          openNewShift={openNewShift}
          openEditShift={openEditShift}
          duplicateShift={duplicateShift}
          setDeleteTarget={setDeleteTarget}
          setDeleteDialogOpen={setDeleteDialogOpen}
        />
      )}

      {/* Dialogs */}
      <ShiftDialog
        open={shiftDialogOpen}
        onOpenChange={setShiftDialogOpen}
        editingShift={editingShift}
        shiftForm={shiftForm}
        setShiftForm={setShiftForm}
        saveShift={saveShift}
      />

      <ProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        editingProfile={editingProfile}
        profileForm={profileForm}
        setProfileForm={setProfileForm}
        saveProfile={saveProfile}
        shifts={shifts}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        deleteTarget={deleteTarget}
        confirmDelete={confirmDelete}
      />
    </div>
  );
}
