import { OrgRole } from '@tornotron/echno-core/employee/types';
import {
  Settings,
  LayoutDashboard,
  GraduationCap,
  CreditCard,
  ScanEye,
} from 'lucide-react';
import type { MetadataRegistry } from '../types';
import { BILLING_ACCESS } from '../access/roles';

export const miscMetadata = {
  settings: {
    label: 'Settings',
    icon: Settings,
    sidebarHidden: true,
  },
  'settings-billing': {
    label: 'Billing',
    icon: CreditCard,
    description: "Your organization's plan, payment method and invoices.",
    sidebarHidden: true,
    access: BILLING_ACCESS,
    hideWhenLocked: true,
  },
  // The organization's computer vision settings. Present only with the
  // vision module on, and for the system admin, who alone can save them.
  'settings-vision': {
    label: 'Computer vision',
    icon: ScanEye,
    description: 'Automatic inference and the model families that run.',
    sidebarHidden: true,
    moduleId: 'vision',
    access: { allowOrgRoles: [OrgRole.SYSTEM_ADMIN] },
    hideWhenLocked: true,
  },
  site: {
    label: 'Site',
    sidebarHidden: true,
  },
  portal: {
    label: 'Portal',
    icon: LayoutDashboard,
    sidebarHidden: true,
  },
  learning: {
    label: 'Learning',
    icon: GraduationCap,
    sidebarHidden: true,
  },
  tasks: {
    label: 'Tasks',
    sidebarHidden: true,
  },
} satisfies MetadataRegistry;
