'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Organization } from '@tornotron/echno-core/organization/types';
import {
  useUpdateUserOrganization,
  useUser,
} from '@tornotron/echno-core/user/hooks';
import { useOrganizations } from '@tornotron/echno-core/organization/hooks';
import { logger } from '@/lib/logger';

interface OrganizationContextType {
  defaultOrganization: Organization | null;
  setDefaultOrganization: (org: Organization | null) => void;
  organizations: Organization[];
  /** @deprecated - provider now fetches organizations internally; kept for compatibility */
  setOrganizations: (orgs: Organization[]) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

function readStoredOrg(): Organization | null {
  if (globalThis.window === undefined) return null;
  const stored = localStorage.getItem('defaultOrganization');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (error) {
    logger.error('Failed to parse stored organization:', error);
    return null;
  }
}

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Explicit user selection. Wrapping in an object lets us distinguish
  // "user explicitly set null" from "no override yet" (undefined).
  const [manualOrg, setManualOrg] = useState<
    { value: Organization | null } | undefined
  >();

  // Read localStorage once on mount — equivalent to useState initializer but
  // does not store the result in state (avoids needing setState in effects).
  const storedOrg = useMemo(() => readStoredOrg(), []);

  const { data: user } = useUser();
  // Fetch organizations directly so the sync does not depend on the selector
  // calling setOrganizations — React Query deduplicates the request.
  const { data: fetchedOrganizations = [] } = useOrganizations();
  const updateOrganizationMutation = useUpdateUserOrganization();

  // Derive defaultOrganization without calling setState in an effect:
  // 1. Explicit user selection (via setDefaultOrganization) takes priority.
  // 2. Once backend data is available, use the user's saved preference.
  // 3. Fall back to localStorage (fast initial render) or first org.
  const defaultOrganization = useMemo(() => {
    if (manualOrg !== undefined) return manualOrg.value;
    if (!user || fetchedOrganizations.length === 0) return storedOrg;
    const userDefaultOrg = fetchedOrganizations.find(
      (org) => org.id === user.defaultOrganizationId
    );
    return userDefaultOrg ?? fetchedOrganizations[0] ?? null;
  }, [user, fetchedOrganizations, manualOrg, storedOrg]);

  // Sync derived defaultOrganization to localStorage (external system — no setState).
  useEffect(() => {
    if (globalThis.window === undefined || !defaultOrganization) return;
    localStorage.setItem(
      'defaultOrganization',
      JSON.stringify(defaultOrganization)
    );
  }, [defaultOrganization]);

  // One-time: update the backend when we auto-select the first org because the
  // user has no saved preference. A ref is intentional — we want this guard to
  // survive React 18 Strict Mode's simulated remount without firing twice.
  const hasAutoSelectedRef = useRef(false);
  useEffect(() => {
    if (!user || fetchedOrganizations.length === 0) return;
    if (user.defaultOrganizationId) return;
    if (hasAutoSelectedRef.current) return;
    const firstOrg = fetchedOrganizations[0];
    if (firstOrg && user.id && firstOrg.id) {
      hasAutoSelectedRef.current = true;
      updateOrganizationMutation.mutate({
        id: user.id,
        organizationId: firstOrg.id,
      });
    }
  }, [user, fetchedOrganizations, updateOrganizationMutation]);

  const setDefaultOrganization = useCallback(
    (org: Organization | null) => {
      setManualOrg({ value: org });

      if (globalThis.window !== undefined) {
        if (org) {
          localStorage.setItem('defaultOrganization', JSON.stringify(org));
        } else {
          localStorage.removeItem('defaultOrganization');
        }
      }

      if (user?.id) {
        updateOrganizationMutation.mutate({
          id: user.id,
          organizationId: org?.id ?? null,
        });
      }
    },
    [user, updateOrganizationMutation]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setOrganizations = useCallback((_orgs: Organization[]) => {
    // No-op: provider now fetches organizations internally via useOrganizations().
    // Kept in context for backward compatibility with any existing callers.
  }, []);

  return (
    <OrganizationContext.Provider
      value={{
        defaultOrganization,
        setDefaultOrganization,
        organizations: fetchedOrganizations,
        setOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      'useOrganization must be used within an OrganizationProvider'
    );
  }
  return context;
}
