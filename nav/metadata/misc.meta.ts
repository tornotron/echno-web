import { Settings, LayoutDashboard, GraduationCap, CreditCard } from 'lucide-react';
import type { MetadataRegistry } from '../types';

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
