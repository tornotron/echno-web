'use client';

import { Clock, Settings, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAttendanceRole } from '@/hooks/attendance';
import { useAttendanceSettingsPage } from '@/hooks/attendance-settings';
import { ShiftTimings } from '@/features/attendance/components/shift-timings';
import { ShiftDialog } from '@/features/attendance/components/shift-dialog';
import { AttendanceProfiles } from '@/features/attendance/components/attendance-profiles';
import { ProfileDialog } from '@/features/attendance/components/profile-dialog';
import { DeleteConfirmDialog } from '@/features/attendance/components/delete-confirm-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { routes } from '@/nav';

// ─── Component ────────────────────────────────────────────────────────────────

const tabs = [
  { id: 'profiles', label: 'Attendance Profiles', icon: Settings },
  { id: 'shifts', label: 'Shift Timings', icon: Clock },
] as const;

export default function AttendanceSettingsPage() {
  const router = useRouter();
  const { canManageSettings, isLoading: roleLoading } = useAttendanceRole();

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
    // Projects
    projects,
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
  } = useAttendanceSettingsPage();

  if (roleLoading) {
    return null;
  }

  if (!canManageSettings) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don&apos;t have permission to access attendance settings. This
            feature is restricted to administrators.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.push(routes.attendance.href)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Attendance
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Attendance Settings"
        description="Configure attendance rules, shift templates, and verification requirements for your organization."
      />

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
        projects={projects}
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
