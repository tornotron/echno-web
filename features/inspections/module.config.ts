import type { ModuleConfig } from '@/lib/modules/module-config';

/**
 * The inspections module's registry contract (first instance of the
 * feature-folder-plus-config pattern; spec section 9.1). Its nav entries
 * mirror what `nav/metadata/inspections.meta.ts` already declares as
 * filesystem routes — see the comment on `ModuleConfig.nav` for why that
 * array documents rather than drives the sidebar for this module.
 */
export const inspectionsModule: ModuleConfig = {
  id: 'inspections',
  entitlementFeatureKey: 'MODULE_INSPECTIONS',
  nav: [
    {
      label: 'Inspections',
      section: 'inspections',
      path: '/users/dashboard/inspections',
      icon: 'ClipboardCheck',
      requiredPermissions: ['inspections:view'],
    },
  ],
};
