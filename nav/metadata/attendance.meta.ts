import {
  UserCheck,
  Settings,
  Calendar,
  CalendarCheck,
  FileText,
  MapPin,
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
  // ── away-from-site approvals ──────────────────────────────────────────────
  // Deliberately carries no `access`, unlike the organisation-wide leave tree
  // where the equivalent queue lives behind MANAGER_AND_ABOVE. The person a
  // held attendance day is routed to is frequently a site supervisor or a
  // foreman: resolveApprover walks employee.manager first, and a reporting
  // manager carries none of the management roles. Gating this entry would hide
  // the queue from the people the records are addressed to.
  //
  // The cost of leaving it open is a menu entry that is empty for most people.
  // The sidebar badge only renders on a non-zero count, so they see the label
  // and never a number against it.
  'attendance-approvals': {
    label: 'Away From Site',
    icon: MapPin,
    breadcrumb: 'Away-From-Site Approvals',
    order: 5,
  },
  // ── my leaves ─────────────────────────────────────────────────────────────
  // The employee's own leave: balance, requests and upcoming time off. The
  // organisation-wide leave surface (approvals, quotas, policies) stays under
  // Workforce, which is where the people who run it look for it.
  'attendance-my-leaves': {
    label: 'My Leaves',
    icon: CalendarCheck,
    breadcrumb: 'My Leaves',
    order: 6,
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
    order: 7,
    access: ADMIN_ONLY,
  },
  'attendance-[id]': {
    label: 'Attendance Record',
    sidebarHidden: true,
  },
} satisfies MetadataRegistry;
