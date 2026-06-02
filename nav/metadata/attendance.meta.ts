import { UserCheck, Settings, Calendar, FileText } from 'lucide-react';
import type { MetadataRegistry } from '../types';
import { ADMIN_ONLY, MANAGER_AND_ABOVE } from '../access/roles';

export const attendanceMetadata = {
  attendance: {
    label: 'Attendance',
    icon: UserCheck,
    order: 7,
  },
  'attendance-mark': {
    label: 'Mark Attendance',
    icon: UserCheck,
    breadcrumb: 'Mark Attendance',
    order: 2,
  },
  'attendance-history': {
    label: 'History',
    icon: Calendar,
    breadcrumb: 'Attendance History',
    order: 3,
  },
  'attendance-regularizations': {
    label: 'Regularizations',
    icon: FileText,
    breadcrumb: 'Regularization Requests',
    order: 4,
  },
  'attendance-settings': {
    label: 'Settings',
    icon: Settings,
    breadcrumb: 'Attendance Settings',
    order: 5,
    access: ADMIN_ONLY,
  },
  'attendance-[id]': {
    label: 'Attendance Record',
    sidebarHidden: true,
  },
} satisfies MetadataRegistry;
