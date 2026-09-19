import type { ModuleConfig } from '@/lib/modules/module-config';

/**
 * The Toolbox Talks module's registry contract. Gated by the backend's
 * `MODULE_TOOLBOX_TALKS` entitlement; an org without it never sees the sidebar
 * entry or the route (`ModuleGuard` sends a direct visit to 403).
 *
 * Started from `bun run scaffold:feature toolbox-talks`. The nav entry here
 * and `nav/metadata/toolbox-talks.meta.ts` describe the same route and the
 * same permission; `module.config.test.ts` keeps them in step.
 */
export const toolboxTalksModule: ModuleConfig = {
  id: 'toolbox-talks',
  entitlementFeatureKey: 'MODULE_TOOLBOX_TALKS',
  nav: [
    {
      label: 'Toolbox Talks',
      section: 'inspections',
      path: '/users/dashboard/toolbox-talks',
      icon: 'Megaphone',
      requiredPermissions: ['toolbox-talks:read'],
    },
  ],
};
