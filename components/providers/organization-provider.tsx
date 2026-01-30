'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { Organization } from '@/types/organization';
import { logger } from '@/lib/logger';
import { useUser } from '@/hooks/user/use-user';
import { useUpdateUserOrganization } from '@/hooks/user/use-user-mutations';

interface OrganizationContextType {
  defaultOrganization: Organization | null;
  setDefaultOrganization: (org: Organization | null) => void;
  organizations: Organization[];
  setOrganizations: (orgs: Organization[]) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize from localStorage during state creation (not in effect)
  const [defaultOrganization, setDefaultOrganizationState] =
    useState<Organization | null>(() => {
      if (globalThis.window === undefined) return null;

      const stored = localStorage.getItem('defaultOrganization');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (error) {
          logger.error('Failed to parse stored organization:', error);
        }
      }
      return null;
    });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const hasInitialized = useRef(false);

  // Get user data from backend (includes defaultOrganizationId)
  const { data: user } = useUser();

  // Mutation for syncing organization preference to backend
  const updateOrganizationMutation = useUpdateUserOrganization();

  // Sync with backend data when user is loaded (only localStorage writes, no setState)
  useEffect(() => {
    if (hasInitialized.current || !user || organizations.length === 0) return;

    const userDefaultOrg = organizations.find(
      (org) => org.id === user.defaultOrganizationId
    );

    if (userDefaultOrg) {
      // User has a saved preference in backend - update localStorage to match
      if (globalThis.window !== undefined) {
        const stored = localStorage.getItem('defaultOrganization');
        const currentStored = stored ? JSON.parse(stored) : null;

        // Only update if different to avoid unnecessary writes
        if (currentStored?.id !== userDefaultOrg.id) {
          localStorage.setItem(
            'defaultOrganization',
            JSON.stringify(userDefaultOrg)
          );
          // Use queueMicrotask to update state outside effect synchronous execution
          queueMicrotask(() => setDefaultOrganizationState(userDefaultOrg));
        }
      }
      hasInitialized.current = true;
    } else if (organizations.length > 0) {
      // No preference saved, use first organization
      const firstOrg = organizations[0];

      // Save to localStorage
      if (globalThis.window !== undefined) {
        localStorage.setItem('defaultOrganization', JSON.stringify(firstOrg));
      }

      // Sync to backend
      if (user.id && firstOrg.id) {
        updateOrganizationMutation.mutate({
          id: user.id,
          organizationId: firstOrg.id,
        });
      }

      // Use queueMicrotask to update state outside effect synchronous execution
      queueMicrotask(() => setDefaultOrganizationState(firstOrg));
      hasInitialized.current = true;
    }
  }, [user, organizations, updateOrganizationMutation]);

  // Update organization and sync to backend
  const setDefaultOrganization = useCallback(
    (org: Organization | null) => {
      setDefaultOrganizationState(org);

      // Save to localStorage
      if (globalThis.window !== undefined) {
        if (org) {
          localStorage.setItem('defaultOrganization', JSON.stringify(org));
        } else {
          localStorage.removeItem('defaultOrganization');
        }
      }

      // Sync to backend
      if (user?.id) {
        updateOrganizationMutation.mutate({
          id: user.id,
          organizationId: org?.id ?? null,
        });
      }
    },
    [user, updateOrganizationMutation]
  );

  return (
    <OrganizationContext.Provider
      value={{
        defaultOrganization,
        setDefaultOrganization,
        organizations,
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
