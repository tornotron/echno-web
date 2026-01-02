/**
 * User-Specific Permission Grants
 *
 * This module handles permissions granted directly to users,
 * working additively with their role-based permissions.
 */

import { Permission } from './permission';
import { Module } from './module';

/**
 * Status of a permission grant
 */
export enum GrantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

/**
 * Scope constraints for permission grants
 * Allows limiting grants to specific contexts
 */
export interface PermissionScope {
  /** Limit to specific projects */
  projectIds?: string[];

  /** Limit to specific organizations */
  organizationIds?: string[];

  /** Limit to specific resources */
  resourceIds?: string[];

  /** Custom conditions for advanced use cases */
  conditions?: Record<string, unknown>;
}

/**
 * User-specific permission grant
 * Allows granting additional permissions to users beyond their role
 */
export interface UserPermissionGrant {
  /** Unique grant ID */
  id: string;

  /** User receiving the permission */
  userId: string;

  /** Permission being granted */
  permission: Permission;

  /** Optional: Limit to specific module */
  module?: Module;

  /** Optional: Limit to specific resource */
  resourceId?: string;

  /** Grant status */
  status: GrantStatus;

  /** When granted */
  grantedAt: Date;

  /** When it expires (optional) */
  expiresAt?: Date | null;

  /** Who granted this permission */
  grantedBy: string;

  /** Reason for granting */
  reason?: string;

  /** Scope constraints */
  scope?: PermissionScope;

  /** Metadata for additional information */
  metadata?: Record<string, unknown>;
}

/**
 * Context for checking user permissions
 */
export interface PermissionCheckContext {
  /** Module being accessed */
  module?: Module;

  /** Specific resource ID */
  resourceId?: string;

  /** Project context */
  projectId?: string;

  /** Organization context */
  organizationId?: string;

  /** Additional context data */
  metadata?: Record<string, unknown>;
}

/**
 * Request to create a new permission grant
 */
export interface CreatePermissionGrantRequest {
  userId: string;
  permission: Permission;
  module?: Module;
  resourceId?: string;
  expiresAt?: Date | null;
  reason?: string;
  scope?: PermissionScope;
}

/**
 * Request to update a permission grant
 */
export interface UpdatePermissionGrantRequest {
  status?: GrantStatus;
  expiresAt?: Date | null;
  reason?: string;
  scope?: PermissionScope;
}

/**
 * Helper function to check if a grant is currently valid
 */
export function isGrantValid(grant: UserPermissionGrant): boolean {
  // Check status
  if (grant.status !== GrantStatus.ACTIVE) return false;

  // Check expiration
  if (grant.expiresAt && grant.expiresAt < new Date()) return false;

  return true;
}

/**
 * Helper function to check if a grant matches a permission check context
 */
export function grantMatchesContext(
  grant: UserPermissionGrant,
  permission: Permission,
  context?: PermissionCheckContext
): boolean {
  // Permission must match
  if (grant.permission !== permission) return false;

  // Grant must be valid
  if (!isGrantValid(grant)) return false;

  // If no context, grant applies
  if (!context) return true;

  // Check module constraint
  if (grant.module && context.module !== grant.module) return false;

  // Check resource constraint
  if (grant.resourceId && context.resourceId !== grant.resourceId) return false;

  // Check scope constraints
  if (grant.scope) {
    // Project scope
    if (
      grant.scope.projectIds &&
      context.projectId &&
      !grant.scope.projectIds.includes(context.projectId)
    )
      return false;

    // Organization scope
    if (
      grant.scope.organizationIds &&
      context.organizationId &&
      !grant.scope.organizationIds.includes(context.organizationId)
    ) {
      return false;
    }

    // Resource scope
    if (
      grant.scope.resourceIds &&
      context.resourceId &&
      !grant.scope.resourceIds.includes(context.resourceId)
    )
      return false;
  }

  return true;
}

/**
 * Get display label for grant status
 */
export function getGrantStatusLabel(status: GrantStatus): string {
  const labels: Record<GrantStatus, string> = {
    [GrantStatus.ACTIVE]: 'Active',
    [GrantStatus.SUSPENDED]: 'Suspended',
    [GrantStatus.EXPIRED]: 'Expired',
    [GrantStatus.REVOKED]: 'Revoked',
  };
  return labels[status];
}

/**
 * Get color class for grant status
 */
export function getGrantStatusColor(status: GrantStatus): string {
  const colors: Record<GrantStatus, string> = {
    [GrantStatus.ACTIVE]:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    [GrantStatus.SUSPENDED]:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    [GrantStatus.EXPIRED]:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    [GrantStatus.REVOKED]:
      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };
  return colors[status];
}
