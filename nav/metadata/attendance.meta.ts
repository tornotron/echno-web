import { UserCheck, ClipboardCheck, Settings } from 'lucide-react';
import type { MetadataRegistry } from '../types';

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
  'attendance-settings': {
    label: 'Settings',
    icon: Settings,
    breadcrumb: 'Attendance Settings',
    order: 3,
  },
  'attendance-[id]': {
    label: 'Attendance Record',
    sidebarHidden: true,
  },
} satisfies MetadataRegistry;
