import { VISION_MODULE_ID } from '@/hooks/use-vision-enabled';
import type { ModuleConfig } from '@/lib/modules/module-config';

/**
 * The computer vision module's registry contract. Gated by the backend's
 * `MODULE_VISION` entitlement, and every `/vision/*` endpoint answers 404
 * while the module is off, so nothing here is fetched or shown unless
 * `vision` is in the organization's enabled-module set: the grid review
 * and the model filters in the observation queue, and the settings page.
 * The regions on an observation are an inspections feature and show
 * regardless.
 *
 * The only route is the settings page, reached from the settings screen
 * rather than the sidebar.
 */
export const visionModule: ModuleConfig = {
  id: VISION_MODULE_ID,
  entitlementFeatureKey: 'MODULE_VISION',
  nav: [
    {
      label: 'Computer vision',
      section: 'system',
      path: '/users/dashboard/settings/vision',
      icon: 'ScanEye',
      requiredPermissions: ['vision:read'],
    },
  ],
};
