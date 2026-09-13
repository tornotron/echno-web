/**
 * Paths the billing surfaces share with the rest of the app: the 403 page
 * that names a module, and the billing settings page it upgrades to. In
 * `lib` so `components/providers` (the module guard) and `app/errors` can
 * both reach them without crossing into `features`.
 */

export const BILLING_SETTINGS_PATH = '/users/dashboard/settings/billing';

/** The 403 page for a module the organization is not entitled to. */
export function moduleDeniedPath(moduleId: string): string {
  return `/errors/403?reason=module&module=${encodeURIComponent(moduleId)}`;
}

/** The entitlement feature key a module is gated on, e.g. `inspections` to `MODULE_INSPECTIONS`. */
export function moduleFeatureKey(moduleId: string): string {
  return `MODULE_${moduleId.replaceAll(/[^a-z0-9]+/gi, '_').toUpperCase()}`;
}

/**
 * The billing settings page with the plan picker scrolled to the plans and
 * the plan that includes `featureKey` highlighted.
 */
export function upgradePath(featureKey?: string | null): string {
  return featureKey
    ? `${BILLING_SETTINGS_PATH}?feature=${encodeURIComponent(featureKey)}#plans`
    : `${BILLING_SETTINGS_PATH}#plans`;
}
