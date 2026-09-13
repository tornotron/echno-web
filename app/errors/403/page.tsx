import { ErrorLayout } from '@/components/errors/error-layout';
import { ShieldAlert } from 'lucide-react';
import { moduleFeatureKey, upgradePath } from '@/lib/billing/paths';

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The action list the 403 page shows. Only a module denial (`reason=module`,
 * set by `ModuleGuard`) gets the upgrade path: a role or suspension denial
 * is not fixed by buying a plan, so those keep the default dashboard action.
 */
export function forbiddenActions(params: SearchParams) {
  if (first(params.reason) !== 'module') return;
  const moduleId = first(params.module);
  return [
    {
      label: 'Upgrade plan',
      href: upgradePath(moduleId ? moduleFeatureKey(moduleId) : null),
      variant: 'default' as const,
    },
    { label: 'Go to Dashboard', href: '/users/dashboard', variant: 'outline' as const },
  ];
}

/**
 * 403 Forbidden Error Page
 *
 * Displayed when the user is authenticated but doesn't have permission
 * This replaces the old /access-denied page
 */
export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const actions = forbiddenActions(params);
  return (
    <ErrorLayout
      statusCode={403}
      title="Access Forbidden"
      description="You don't have permission to access this resource."
      icon={ShieldAlert}
      iconColor="text-red-500"
      reasons={[
        "Your organization hasn't purchased this module",
        "Your role doesn't have the required permissions",
        'Your trial period has expired',
        'Module access has been suspended',
      ]}
      actions={actions}
      additionalInfo={
        <div className="space-y-2">
          <p className="font-medium">Need access?</p>
          <p className="text-sm">
            {actions
              ? 'This module is part of a paid plan. An organization administrator can upgrade the plan from Billing.'
              : 'Contact your system administrator or organization owner to request the necessary permissions or upgrade your plan.'}
          </p>
        </div>
      }
    />
  );
}
