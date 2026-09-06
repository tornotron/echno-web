import {
  UserCheck,
  Settings,
  Calendar,
  CalendarCheck,
  FileText,
} from 'lucide-react';
import type { MetadataRegistry } from '../types';
import { ADMIN_ONLY } from '../access/roles';

export const attendanceMetadata = {
  // Named for the person using it rather than the record type. Everything a
  // user needs about their own time sits here: marking in and out, the history
  // behind it, a regularization when the record is wrong, and leave. Leave used
  // to live under Workforce, next to the organisation-wide leave admin, which
  // put a site engineer's own time off in the same place as the approvals queue.
  attendance: {
    label: 'My Attendance',
    icon: UserCheck,
    section: 'workforce',
    order: 8,
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
  // ── my leaves ─────────────────────────────────────────────────────────────
  // The employee's own leave: balance, requests and upcoming time off. The
  // organisation-wide leave surface (approvals, quotas, policies) stays under
  // Workforce, which is where the people who run it look for it.
  'attendance-my-leaves': {
    label: 'My Leaves',
    icon: CalendarCheck,
    breadcrumb: 'My Leaves',
    order: 5,
  },
  // Always self-scoped: the form reads the signed-in user's employee record and
  // has no field for applying on someone else's behalf. It sat under the
  // organisational leave tree, which is why it is a move rather than a new page.
  'attendance-my-leaves-apply': {
    label: 'Apply for Leave',
    breadcrumb: 'Apply for Leave',
    sidebarHidden: true,
  },
  'attendance-settings': {
    label: 'Settings',
    icon: Settings,
    breadcrumb: 'Attendance Settings',
    order: 6,
    access: ADMIN_ONLY,
  },
  'attendance-[id]': {
    label: 'Attendance Record',
    sidebarHidden: true,
  },
} satisfies MetadataRegistry;
