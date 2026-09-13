'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { ModuleId } from '@tornotron/echno-core/module/types';
import { Button } from '@/components/shadcn/button';
import { useEnabledModuleIds } from '@/hooks/use-enabled-module-ids';
import { moduleDeniedPath } from '@/lib/billing/paths';

interface ModuleGuardProps {
  /** The module this route segment belongs to. */
  moduleId: ModuleId;
  children: React.ReactNode;
}

/**
 * Guards a module's routes on the client: once the enabled-module set is
 * known and does not include `moduleId`, redirects to the shared 403 surface
 * (`app/errors/403`) with `reason=module&module=<id>`, so the page can
 * offer the upgrade path to the plan that includes the module (#448).
 *
 * Deliberately client-side for this iteration, per
 * `echno-backend/docs/specs/2026-08-26-modular-plugin-architecture.md`
 * section 9.3: the backend is the real enforcement boundary (every module
 * endpoint checks entitlement server-side), so a user who reaches the API
 * directly still gets refused there. This only stops the client from
 * rendering a module's page shell for an org that hasn't got the module.
 *
 * While the enabled-module set is still loading this renders `children`
 * rather than guessing: nothing goes dark before the answer is known. A
 * failed fetch is "unknown", not "allowed": it renders a short panel with a
 * retry instead of the module's shell, so a 5xx or a dropped request does
 * not show an unentitled org the page chrome (web #455). The nav keeps its
 * own fallback for that case.
 */
export function ModuleGuard({ moduleId, children }: ModuleGuardProps) {
  const router = useRouter();
  const { moduleIds, isLoading, isError, refetch } = useEnabledModuleIds();

  const denied =
    !isLoading && moduleIds !== undefined && !moduleIds.has(moduleId);

  useEffect(() => {
    if (denied) {
      router.replace(moduleDeniedPath(moduleId));
    }
  }, [denied, moduleId, router]);

  if (denied) return null;
  if (!isLoading && isError && moduleIds === undefined) {
    return <PlanUnknownPanel onRetry={() => void refetch()} />;
  }
  return <>{children}</>;
}

function PlanUnknownPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 rounded-md border p-6 text-center"
      role="alert"
      data-testid="module-guard-error"
    >
      <AlertTriangle className="size-6 text-amber-600" />
      <p className="font-medium">Could not confirm your plan</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        The list of modules your organization has enabled did not load, so this
        page is held back until it does.
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="size-4" />
        Retry
      </Button>
    </div>
  );
}
