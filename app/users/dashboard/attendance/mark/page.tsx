'use client';

import { useModuleAccess } from '@/hooks/use-rbac';
import { Module } from '@/types/rbac/module';

import { MarkAttendanceForm } from '@/features/attendance/components/mark-attendance-form';
import { ClipboardCheck } from 'lucide-react';

export default function MarkAttendancePage() {
  // Check module access
  useModuleAccess(Module.ATTENDANCE);

  const breadcrumbs = [
    { label: 'Dashboard', href: '/users/dashboard' },
    { label: 'Attendance', href: '/users/dashboard/attendance' },
    { label: 'Mark Attendance' },
  ];

  return <MarkAttendanceForm />;
}
