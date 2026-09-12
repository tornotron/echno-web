/**
 * nav/access/evaluate.ts
 *
 * Access evaluation helpers. Used by the sidebar, permission gates,
 * and any code that needs to check whether a user can see or use a route.
 */

import type { ModuleId } from '@tornotron/echno-core/module/types';
import type { AccessConfig, Role, Permission } from './roles';
import type { ComposedNavItem } from '../types';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface AccessContext {
  /** The user's org-level role. */
  role?: Role;
  /** Fine-grained permissions granted to the user. */
  permissions?: Permission[];
  /**
   * The user's backend org roles, verbatim from `Employee.orgRoles`, for
   * configs that gate on `allowOrgRoles`. Unlike `enabledModules`, `undefined`
   * here does NOT mean "not gating": an org-role-gated item is denied until a
   * caller supplies the roles, because a reader of unknown standing must not
   * be offered a link that 403s. Callers that never gate on org roles can
   * leave it out with no effect on tier or permission checks.
   */
  orgRoles?: readonly string[];
  /** Whether the user is authenticated at all. */
  isAuthenticated: boolean;
  /**
   * The set of modules enabled and entitled for the current org, as loaded
   * from `GET /api/v1/modules/web/enabled`. `undefined` means "not gating by
   * module" — either the check hasn't been wired up by this caller, or the
   * loader fell back after a failed/empty fetch — so every item passes
   * regardless of `moduleId`. An empty `Set` is a real "nothing enabled"
   * answer and does gate.
   */
  enabledModules?: Set<ModuleId>;
}

// ---------------------------------------------------------------------------
// Module gate
// ---------------------------------------------------------------------------

/**
 * Returns true when a nav item's module (if any) is enabled for the org.
 *
 * Items with no `moduleId` are core routes and always pass. When
 * `ctx.enabledModules` is `undefined` the caller isn't gating by module at
 * all (see {@link AccessContext.enabledModules}), so this also passes.
 */
export function isModuleVisible(
  moduleId: ModuleId | undefined,
  ctx: Pick<AccessContext, 'enabledModules'>
): boolean {
  if (!moduleId) return true;
  if (!ctx.enabledModules) return true;
  return ctx.enabledModules.has(moduleId);
}

// ---------------------------------------------------------------------------
// Core evaluator
// ---------------------------------------------------------------------------

/**
 * Returns true when the given AccessConfig allows access for the provided context.
 *
 * Evaluation order:
 *  1. requireAuth check
 *  2. denyRoles check (deny wins over allow)
 *  3. allowRoles check (empty = all roles pass)
 *  4. allowOrgRoles check (any one held passes; missing ctx.orgRoles fails)
 *  5. permissions check (all must pass)
 */
export function canAccess(config: AccessConfig, ctx: AccessContext): boolean {
  if (config.requireAuth && !ctx.isAuthenticated) return false;

  if (
    config.denyRoles?.length &&
    ctx.role &&
    config.denyRoles.includes(ctx.role)
  ) {
    return false;
  }

  if (
    config.allowRoles?.length &&
    (!ctx.role || !config.allowRoles.includes(ctx.role))
  )
    return false;

  if (config.allowOrgRoles?.length) {
    const held = ctx.orgRoles;
    if (!held || !config.allowOrgRoles.some((r) => held.includes(r)))
      return false;
  }

  if (config.permissions?.length) {
    const userPerms = ctx.permissions ?? [];
    const hasAll = config.permissions.every((p) => userPerms.includes(p));
    if (!hasAll) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Nav-tree filter
// ---------------------------------------------------------------------------

/**
 * Recursively filter a nav tree to only include items accessible in the
 * given context. Preserves tree shape; removes inaccessible subtrees.
 */
export function filterNavByAccess(
  items: ComposedNavItem[],
  ctx: AccessContext
): ComposedNavItem[] {
  return items
    .filter(
      (item) =>
        canAccess(item.access, ctx) && isModuleVisible(item.moduleId, ctx)
    )
    .map((item) => ({
      ...item,
      children: filterNavByAccess(item.children, ctx),
    }));
}

// ---------------------------------------------------------------------------
// Sidebar access resolution (annotate, don't filter)
// ---------------------------------------------------------------------------

/** A nav item annotated with whether the current context may use it. */
export type ResolvedNavItem = Omit<ComposedNavItem, 'children'> & {
  /** True when the context fails this item's AccessConfig. */
  locked: boolean;
  children: ResolvedNavItem[];
};

/**
 * Recursively annotate a nav tree with a `locked` flag instead of removing
 * inaccessible items, so the sidebar can render them greyed out with a lock.
 *
 * Items marked `hideWhenLocked` are still dropped outright when locked, as are
 * the locked children of an accessible parent — a parent the user *can* open
 * should not advertise sub-pages they cannot reach. Children of a locked parent
 * are kept so the disabled group still reads as a coherent module.
 *
 * A module-gated item (see `moduleId`) is not merely locked when its module
 * is absent from the enabled set: it is dropped outright, subtree and all,
 * before locking is even computed. Unlike a role/permission lock, there is
 * nothing to upsell here for a module the org's plan doesn't cover.
 */
export function resolveSidebarAccess(
  items: ComposedNavItem[],
  ctx: AccessContext
): ResolvedNavItem[] {
  return items
    .filter((item) => isModuleVisible(item.moduleId, ctx))
    .map((item) => {
      const locked = !canAccess(item.access, ctx);
      const children = resolveSidebarAccess(item.children, ctx);

      return {
        ...item,
        locked,
        children: locked ? children : children.filter((c) => !c.locked),
      };
    })
    .filter((item) => !(item.locked && item.hideWhenLocked));
}

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------

/** Returns true when the role is manager or admin. */
export function isManagerOrAbove(role?: Role): boolean {
  return role === 'admin' || role === 'manager';
}

/** Returns true when the role is admin. */
export function isAdmin(role?: Role): boolean {
  return role === 'admin';
}
