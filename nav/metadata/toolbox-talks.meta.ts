import { Megaphone } from 'lucide-react';
import type { MetadataRegistry } from '../types';

/**
 * Sidebar and breadcrumb metadata for the Toolbox Talks module. The
 * `moduleId` hides the entry for an org without `MODULE_TOOLBOX_TALKS`; the
 * permission matches `features/toolbox-talks/module.config.ts`. The talks
 * sit in the Inspections section with the other site-safety records.
 */
export const toolboxTalksMetadata = {
  'toolbox-talks': {
    label: 'Toolbox Talks',
    icon: Megaphone,
    section: 'inspections',
    order: 5,
    breadcrumb: 'Toolbox Talks',
    moduleId: 'toolbox-talks',
    access: { permissions: ['toolbox-talks:read'] },
  },
  'toolbox-talks-new': { label: 'New Talk', sidebarHidden: true },
  'toolbox-talks-[id]': {
    label: 'Talk',
    breadcrumb: 'Talk',
    sidebarHidden: true,
  },
  'toolbox-talks-[id]-edit': { label: 'Edit', sidebarHidden: true },
} satisfies MetadataRegistry;
