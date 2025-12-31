/**
 * RBAC React Hooks
 *
 * Convenient hooks for using the module-centric RBAC system in React components
 *
 * USAGE:
 * ```tsx
 * import { useModuleAccess, useCanPerform } from '@/hooks/use-rbac';
 *
 * function MyComponent() {
 *   const canCreate = useCanPerform(Module.TASK, 'create');
 *   const hasFinance = useModuleAccess(Module.FINANCE);
 *
 *   return (
 *     <div>
 *       {canCreate && <Button>Create Task</Button>}
 *       {hasFinance && <FinanceSection />}
 *     </div>
 *   );
 * }
 * ```
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Module,
  ModuleAction,
  canUserPerformAction,
  hasModuleAccess,
  getUserAllowedActions,
  canUserPerformActions,
  getUserModules,
  UserModuleEntitlement,
} from '@/lib/rbac';

/**
 * Hook to check if user can perform a specific action on a module
 *
 * @param module - Module to check
 * @param action - Action to check
 * @param resource - Optional resource context (for own/team checks)
 * @returns Boolean indicating if action is allowed
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
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!session?.user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      // Type assertion for extended session user
      const user = session.user as {
        id: string;
        roles?: string[];
        organizationId?: string;
        entitlements?: UserModuleEntitlement[];
      };

      const result = await canUserPerformAction(
        {
          userId: user.id,
          userRoles: user.roles || [],
          organizationId: user.organizationId || '',
          module,
          action,
          resource,
        },
        user.entitlements || []
      );

      setAllowed(result.allowed);
      setLoading(false);
    }

    checkAccess();
  }, [session, module, action, resource]);

  return loading ? false : allowed;
}

/**
 * Hook to check if user has access to a module at all
 *
 * @param module - Module to check
 * @returns Boolean indicating if user has access
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

      // Type assertion for extended session user
      const user = session.user as {
        id: string;
        organizationId?: string;
        entitlements?: UserModuleEntitlement[];
      };

      const access = await hasModuleAccess(
        user.id,
        user.organizationId || '',
        module,
        user.entitlements || []
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
 *
 * @param module - Module to check
 * @returns Array of allowed actions
 */
export function useAllowedActions(module: Module): ModuleAction[] {
  const { data: session } = useSession();

  // Compute directly from session - no need for effect or state
  // This is a pure derived value from session data
  if (!session?.user?.roles) {
    return [];
  }

  return getUserAllowedActions(session.user.roles, module);
}

/**
 * Hook to check multiple actions at once
 * Useful for determining which UI elements to show
 *
 * @param module - Module to check
 * @param actions - Actions to check
 * @returns Record of action → allowed boolean
 */
export function useCanPerformMultiple(
  module: Module,
  actions: ModuleAction[]
): Record<ModuleAction, boolean> {
  const { data: session } = useSession();
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

      // Type assertion for extended session user
      const user = session.user as {
        id: string;
        roles?: string[];
        organizationId?: string;
        entitlements?: UserModuleEntitlement[];
      };

      const batchResults = await canUserPerformActions(
        {
          userId: user.id,
          userRoles: user.roles || [],
          organizationId: user.organizationId || '',
          module,
        },
        actions,
        user.entitlements || []
      );

      setResults(batchResults);
      setLoading(false);
    }

    checkAccess();
  }, [session, module, actions]);

  return loading ? ({} as Record<ModuleAction, boolean>) : results;
}

/**
 * Hook to get all modules user has access to
 *
 * @returns Array of accessible modules
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

      // Type assertion for extended session user
      const user = session.user as {
        id: string;
        organizationId?: string;
        entitlements?: UserModuleEntitlement[];
      };

      const userModules = await getUserModules(
        user.id,
        user.organizationId || '',
        user.entitlements || []
      );

      setModules(userModules);
      setLoading(false);
    }

    loadModules();
  }, [session]);

  return loading ? [] : modules;
}

/**
 * Hook to check if user is super admin
 *
 * @returns Boolean indicating if user is super admin
 */
export function useIsSuperAdmin(): boolean {
  const { data: session } = useSession();

  return (
    session?.user?.roles?.includes('super-admin') ||
    session?.user?.roles?.includes('SUPER_ADMIN') ||
    false
  );
}

/**
 * Comprehensive RBAC hook with all checks
 * Returns object with multiple helpful properties
 *
 * @param module - Module to check
 * @returns Object with access information
 */
export function useRBAC(module: Module) {
  const { data: session } = useSession();
  const [state, setState] = useState({
    hasAccess: false,
    allowedActions: [] as ModuleAction[],
    canView: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canAssign: false,
    canApprove: false,
    isSuperAdmin: false,
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
          isSuperAdmin: false,
          loading: false,
        });
        return;
      }

      // Type assertion for extended session user
      const user = session.user as {
        id: string;
        roles?: string[];
        organizationId?: string;
        entitlements?: UserModuleEntitlement[];
      };

      const hasAccess = await hasModuleAccess(
        user.id,
        user.organizationId || '',
        module,
        user.entitlements || []
      );

      const allowedActions = getUserAllowedActions(user.roles || [], module);

      const isSuperAdmin =
        user.roles?.includes('super-admin') ||
        user.roles?.includes('SUPER_ADMIN') ||
        false;

      setState({
        hasAccess,
        allowedActions,
        canView: allowedActions.includes('view'),
        canCreate: allowedActions.includes('create'),
        canUpdate: allowedActions.includes('update'),
        canDelete: allowedActions.includes('delete'),
        canAssign: allowedActions.includes('assign'),
        canApprove: allowedActions.includes('approve'),
        isSuperAdmin,
        loading: false,
      });
    }

    loadState();
  }, [session, module]);

  return state;
}
