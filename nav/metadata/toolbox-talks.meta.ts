import { Puzzle } from 'lucide-react';
import type { MetadataRegistry } from '../types';

/**
 * Sidebar and breadcrumb metadata for the Toolbox Talks module. The
 * `moduleId` hides the entry for an org without `MODULE_TOOLBOX_TALKS`; the
 * permission matches `features/toolbox-talks/module.config.ts`.
 */
export const toolboxTalksMetadata = {
  'toolbox-talks': {
    label: 'Toolbox Talks',
    icon: Puzzle,
    section: 'projects',
    order: 50,
    breadcrumb: 'Toolbox Talks',
    moduleId: 'toolbox-talks',
    access: { permissions: ['toolbox-talks:read'] },
  },
} satisfies MetadataRegistry;
