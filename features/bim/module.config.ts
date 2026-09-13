import type { ModuleConfig } from '@/lib/modules/module-config';

/**
 * The BIM module's registry contract (design note
 * `echno-roadmap/bim/bim-ingestion-viewer-element-identity.md`). Gated by the
 * backend's `MODULE_BIM` entitlement; an org without it never sees the
 * project's BIM tab or route (`ModuleGuard` sends a direct visit to 403).
 *
 * The viewer lives under the project detail, so the nav entry documents the
 * route the project page links to rather than adding a sidebar section.
 */
export const bimModule: ModuleConfig = {
  id: 'bim',
  entitlementFeatureKey: 'MODULE_BIM',
  nav: [
    {
      label: 'BIM',
      section: 'projects',
      path: '/users/dashboard/projects/all-projects/[id]/bim',
      icon: 'Box',
      requiredPermissions: ['bim:view'],
    },
  ],
};
