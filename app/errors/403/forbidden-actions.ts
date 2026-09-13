import { moduleFeatureKey, upgradePath } from '@/lib/billing/paths';

export type SearchParams = Record<string, string | string[] | undefined>;

export interface ForbiddenAction {
  label: string;
  href: string;
  variant: 'default' | 'outline';
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** True when the 403 came from `ModuleGuard`: the organization is not entitled to the module. */
export function isModuleDenial(params: SearchParams): boolean {
  return first(params.reason) === 'module';
}

/**
 * The action list the 403 page shows. Only a module denial (`reason=module`,
 * set by `ModuleGuard`) gets the upgrade path: a role or suspension denial
 * is not fixed by buying a plan, so those keep the default dashboard action.
 *
 * The upgrade link itself is offered only to a reader who can act on it
 * (`canUpgrade`: the organization's system admin, the one role the backend
 * serves billing to). Anyone else is told to ask an administrator (#456).
 */
export function forbiddenActions(
  params: SearchParams,
  canUpgrade: boolean
): ForbiddenAction[] | undefined {
  if (!isModuleDenial(params)) return;
  const dashboard: ForbiddenAction = {
    label: 'Go to Dashboard',
    href: '/users/dashboard',
    variant: canUpgrade ? 'outline' : 'default',
  };
  if (!canUpgrade) return [dashboard];
  const moduleId = first(params.module);
  return [
    {
      label: 'Upgrade plan',
      href: upgradePath(moduleId ? moduleFeatureKey(moduleId) : null),
      variant: 'default',
    },
    dashboard,
  ];
}

/** The "Need access?" line under the reasons list. */
export function forbiddenAdvice(params: SearchParams, canUpgrade: boolean): string {
  if (!isModuleDenial(params)) {
    return 'Contact your system administrator or organization owner to request the necessary permissions or upgrade your plan.';
  }
  return canUpgrade
    ? 'This module is part of a paid plan. You can upgrade the plan from Billing.'
    : 'This module is part of a paid plan. Ask your administrator to upgrade the plan; billing is managed by the organization\'s system admin.';
}
