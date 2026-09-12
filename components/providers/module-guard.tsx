'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ModuleId } from '@tornotron/echno-core/module/types';
import { useEnabledModuleIds } from '@/hooks/use-enabled-module-ids';

interface ModuleGuardProps {
  /** The module this route segment belongs to. */
  moduleId: ModuleId;
  children: React.ReactNode;
}

/**
 * Guards a module's routes on the client: once the enabled-module set is
 * known and does not include `moduleId`, redirects to the shared 403 surface
 * (`app/errors/403`), whose reasons list already leads with "your
 * organization hasn't purchased this module".
 *
 * Deliberately client-side for this iteration, per
 * `echno-backend/docs/specs/2026-08-26-modular-plugin-architecture.md`
 * section 9.3: the backend is the real enforcement boundary (every module
 * endpoint checks entitlement server-side), so a user who reaches the API
 * directly still gets refused there. This only stops the client from
 * rendering a module's page shell for an org that hasn't got the module.
 *
 * While the enabled-module set is still loading, or the loader has fallen
 * back to "no gating" (see `useEnabledModuleIds`), this renders `children`
 * rather than guessing: nothing goes dark before the answer is known.
 */
export function ModuleGuard({ moduleId, children }: ModuleGuardProps) {
  const router = useRouter();
  const { moduleIds, isLoading } = useEnabledModuleIds();

  const denied =
    !isLoading && moduleIds !== undefined && !moduleIds.has(moduleId);

  useEffect(() => {
    if (denied) {
      router.replace('/errors/403');
    }
  }, [denied, router]);

  if (denied) return null;
  return <>{children}</>;
}
