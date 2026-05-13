import { Settings, LayoutDashboard, GraduationCap } from 'lucide-react';
import type { MetadataRegistry } from '../types';

export const miscMetadata = {
  settings: {
    label: 'Settings',
    icon: Settings,
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
