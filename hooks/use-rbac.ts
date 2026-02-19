/**
 * RBAC React Hooks
 *
 * Convenient hooks for using the module-centric RBAC system in React components.
 * Sources roles from employee.orgRoles via useEmployeeRoles().
 *
 * NOTE: Module entitlements are temporarily disabled — all modules are accessible.
 * Entitlement management will move to the backend / Keycloak.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useEmployeeRoles } from '@/hooks/employee/use-employee-roles';
import { OrgRole } from '@/types/employee';
import {
  Module,
  ModuleAction,
  canUserPerformAction,
  hasModuleAccess,
  getUserAllowedActions,
  canUserPerformActions,
  getUserModules,
} from '@/lib/rbac';

/**
 * Hook to check if user can perform a specific action on a module
 */
export function useCanPerform(
  module: Module,
  action: ModuleAction,
  resource?: {
    id: string;
    type: string;
    ownerId?: string;
    teamId?: string;
  }
): boolean {
  const { data: session } = useSession();
  const { orgRoles } = useEmployeeRoles();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!session?.user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const user = session.user as {
        id: string;
        organizationId?: string;
      };

      const result = await canUserPerformAction({
        userId: user.id,
        userRoles: orgRoles,
        organizationId: user.organizationId || '',
        module,
        action,
        resource,
      });

      setAllowed(result.allowed);
      setLoading(false);
    }

    checkAccess();
  }, [session, module, action, resource, orgRoles]);

  return loading ? false : allowed;
}

/**
 * Hook to check if user has access to a module at all
 *
 * NOTE: Entitlements disabled — always returns true for authenticated users.
 */
export function useModuleAccess(module: Module): boolean {
  const { data: session } = useSession();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!session?.user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const user = session.user as {
        id: string;
        organizationId?: string;
      };

      const access = await hasModuleAccess(
        user.id,
        user.organizationId || '1',
        module
      );

      setHasAccess(access);
      setLoading(false);
    }

    checkAccess();
  }, [session, module]);

  return loading ? false : hasAccess;
}

/**
 * Hook to get all actions user can perform on a module
 */
export function useAllowedActions(module: Module): ModuleAction[] {
  const { orgRoles } = useEmployeeRoles();

  if (orgRoles.length === 0) {
    return [];
  }

  return getUserAllowedActions(orgRoles, module);
}

/**
 * Hook to check multiple actions at once
 */
export function useCanPerformMultiple(
  module: Module,
  actions: ModuleAction[]
): Record<ModuleAction, boolean> {
  const { data: session } = useSession();
  const { orgRoles } = useEmployeeRoles();
  const [results, setResults] = useState<Record<ModuleAction, boolean>>(
    {} as Record<ModuleAction, boolean>
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!session?.user) {
        const emptyResults = {} as Record<ModuleAction, boolean>;
        for (const action of actions) {
          emptyResults[action] = false;
        }
        setResults(emptyResults);
        setLoading(false);
        return;
      }

      const user = session.user as {
        id: string;
        organizationId?: string;
      };

      const batchResults = await canUserPerformActions(
        {
          userId: user.id,
          userRoles: orgRoles,
          organizationId: user.organizationId || '1',
          module,
        },
        actions
      );

      setResults(batchResults);
      setLoading(false);
    }

    checkAccess();
  }, [session, module, actions, orgRoles]);

  return loading ? ({} as Record<ModuleAction, boolean>) : results;
}

/**
 * Hook to get all modules user has access to
 *
 * NOTE: Entitlements disabled — returns all modules for authenticated users.
 */
export function useUserModules(): Module[] {
  const { data: session } = useSession();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadModules() {
      if (!session?.user) {
        setModules([]);
        setLoading(false);
        return;
      }

      const userModules = await getUserModules();

      setModules(userModules);
      setLoading(false);
    }

    loadModules();
  }, [session]);

  return loading ? [] : modules;
}

/**
 * Hook to check if user is system admin
 */
export function useIsSystemAdmin(): boolean {
  const { orgRoles } = useEmployeeRoles();

  return orgRoles.includes(OrgRole.SYSTEM_ADMIN);
}

/**
 * Comprehensive RBAC hook with all checks
 */
export function useRBAC(module: Module) {
  const { data: session } = useSession();
  const { orgRoles } = useEmployeeRoles();
  const [state, setState] = useState({
    hasAccess: false,
    allowedActions: [] as ModuleAction[],
    canView: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canAssign: false,
    canApprove: false,
    isSystemAdmin: false,
    loading: true,
  });

  useEffect(() => {
    async function loadState() {
      if (!session?.user) {
        setState({
          hasAccess: false,
          allowedActions: [],
          canView: false,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
          canAssign: false,
          canApprove: false,
          isSystemAdmin: false,
          loading: false,
        });
        return;
      }

      const allowedActions = getUserAllowedActions(orgRoles, module);
      const isSystemAdmin = orgRoles.includes(OrgRole.SYSTEM_ADMIN);

      setState({
        hasAccess: true, // Entitlements disabled — always accessible
        allowedActions,
        canView: allowedActions.includes('view'),
        canCreate: allowedActions.includes('create'),
        canUpdate: allowedActions.includes('update'),
        canDelete: allowedActions.includes('delete'),
        canAssign: allowedActions.includes('assign'),
        canApprove: allowedActions.includes('approve'),
        isSystemAdmin,
        loading: false,
      });
    }

    loadState();
  }, [session, module, orgRoles]);

  return state;
}
