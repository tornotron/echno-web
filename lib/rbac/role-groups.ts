import { SYSTEM_ROLES } from '@/types/rbac/role';

/**
 * Role Groups Configuration
 *
 * Defines the mapping between Keycloak groups and application behavior.
 * Groups in Keycloak are hierarchical paths (e.g., "/management", "/engineering/frontend").
 *
 * This module provides:
 * - Group constants matching Keycloak group names
 * - Group → Dashboard routing
 * - Group → Role membership mappings
 * - Utility functions for group detection
 */

/**
 * Keycloak Group Names
 *
 * These should match the group names configured in Keycloak.
 * Group paths in tokens include leading slash (e.g., "/management"),
 * but we store them without the slash for consistency.
 */
export const KEYCLOAK_GROUPS = {
  // Core organizational groups
  ADMIN: 'admin',
  MANAGEMENT: 'management',
  ENGINEERING: 'engineering',
  FINANCE: 'finance',
  HR: 'hr',

  // Operational groups
  SITE_OPERATIONS: 'site-operations',
  FIELD_WORKERS: 'field-workers',

  // External stakeholders
  EXTERNAL: 'external',
  CONTRACTORS: 'contractors',
  CLIENTS: 'clients',

  // Training/Development
  TRAINEES: 'trainees',
} as const;

export type KeycloakGroup =
  (typeof KEYCLOAK_GROUPS)[keyof typeof KEYCLOAK_GROUPS];

/**
 * Dashboard Routes per Group
 *
 * Maps each group to their default dashboard route after login.
 * Order matters - first matching group wins.
 */
export const GROUP_DASHBOARDS: Record<KeycloakGroup, string> = {
  [KEYCLOAK_GROUPS.ADMIN]: '/admin',
  [KEYCLOAK_GROUPS.MANAGEMENT]: '/users/dashboard',
  [KEYCLOAK_GROUPS.ENGINEERING]: '/users/dashboard/projects',
  [KEYCLOAK_GROUPS.FINANCE]: '/users/dashboard/finance',
  [KEYCLOAK_GROUPS.HR]: '/users/dashboard/workforce',
  [KEYCLOAK_GROUPS.SITE_OPERATIONS]: '/users/dashboard/site',
  [KEYCLOAK_GROUPS.FIELD_WORKERS]: '/users/dashboard/tasks',
  [KEYCLOAK_GROUPS.EXTERNAL]: '/users/dashboard/portal',
  [KEYCLOAK_GROUPS.CONTRACTORS]: '/users/dashboard/portal',
  [KEYCLOAK_GROUPS.CLIENTS]: '/users/dashboard/portal',
  [KEYCLOAK_GROUPS.TRAINEES]: '/users/dashboard/learning',
};

/**
 * Group Priority Order
 *
 * When a user belongs to multiple groups, the first matching group
 * in this list determines their primary dashboard.
 */
export const GROUP_PRIORITY: KeycloakGroup[] = [
  KEYCLOAK_GROUPS.ADMIN,
  KEYCLOAK_GROUPS.MANAGEMENT,
  KEYCLOAK_GROUPS.FINANCE,
  KEYCLOAK_GROUPS.HR,
  KEYCLOAK_GROUPS.ENGINEERING,
  KEYCLOAK_GROUPS.SITE_OPERATIONS,
  KEYCLOAK_GROUPS.FIELD_WORKERS,
  KEYCLOAK_GROUPS.CONTRACTORS,
  KEYCLOAK_GROUPS.CLIENTS,
  KEYCLOAK_GROUPS.EXTERNAL,
  KEYCLOAK_GROUPS.TRAINEES,
];

/**
 * Role → Group Mapping
 *
 * Defines which roles belong to which groups.
 * Used as fallback when Keycloak groups aren't configured.
 * Also useful for role-based group inference.
 */
export const ROLE_TO_GROUP: Record<string, KeycloakGroup> = {
  // Admin
  [SYSTEM_ROLES.SYSTEM_ADMIN]: KEYCLOAK_GROUPS.ADMIN,

  // Management
  [SYSTEM_ROLES.PROJECT_MANAGER]: KEYCLOAK_GROUPS.MANAGEMENT,
  [SYSTEM_ROLES.SITE_MANAGER]: KEYCLOAK_GROUPS.MANAGEMENT,
  [SYSTEM_ROLES.DIRECTOR]: KEYCLOAK_GROUPS.MANAGEMENT,

  // HR
  [SYSTEM_ROLES.HR_MANAGER]: KEYCLOAK_GROUPS.HR,

  // Finance
  [SYSTEM_ROLES.ACCOUNTANT]: KEYCLOAK_GROUPS.FINANCE,
  [SYSTEM_ROLES.QUANTITY_SURVEYOR]: KEYCLOAK_GROUPS.FINANCE,

  // Engineering
  [SYSTEM_ROLES.CIVIL_ENGINEER]: KEYCLOAK_GROUPS.ENGINEERING,
  [SYSTEM_ROLES.SITE_ENGINEER]: KEYCLOAK_GROUPS.ENGINEERING,
  [SYSTEM_ROLES.STRUCTURAL_ENGINEER]: KEYCLOAK_GROUPS.ENGINEERING,
  [SYSTEM_ROLES.ARCHITECT]: KEYCLOAK_GROUPS.ENGINEERING,
  [SYSTEM_ROLES.PLANNING_ENGINEER]: KEYCLOAK_GROUPS.ENGINEERING,
  [SYSTEM_ROLES.TECHNICAL_COORDINATOR]: KEYCLOAK_GROUPS.ENGINEERING,

  // Site Operations
  [SYSTEM_ROLES.SUPERVISOR]: KEYCLOAK_GROUPS.SITE_OPERATIONS,
  [SYSTEM_ROLES.FOREMAN]: KEYCLOAK_GROUPS.SITE_OPERATIONS,
  [SYSTEM_ROLES.SAFETY_OFFICER]: KEYCLOAK_GROUPS.SITE_OPERATIONS,
  [SYSTEM_ROLES.PROCUREMENT_OFFICER]: KEYCLOAK_GROUPS.SITE_OPERATIONS,

  // Field Workers
  [SYSTEM_ROLES.ELECTRICIAN]: KEYCLOAK_GROUPS.FIELD_WORKERS,
  [SYSTEM_ROLES.PLUMBER]: KEYCLOAK_GROUPS.FIELD_WORKERS,
  [SYSTEM_ROLES.CARPENTER]: KEYCLOAK_GROUPS.FIELD_WORKERS,
  [SYSTEM_ROLES.MASON]: KEYCLOAK_GROUPS.FIELD_WORKERS,
  [SYSTEM_ROLES.WELDER]: KEYCLOAK_GROUPS.FIELD_WORKERS,
  [SYSTEM_ROLES.PAINTER]: KEYCLOAK_GROUPS.FIELD_WORKERS,
  [SYSTEM_ROLES.SCAFFOLDER]: KEYCLOAK_GROUPS.FIELD_WORKERS,
  [SYSTEM_ROLES.EQUIPMENT_OPERATOR]: KEYCLOAK_GROUPS.FIELD_WORKERS,
  [SYSTEM_ROLES.CRANE_OPERATOR]: KEYCLOAK_GROUPS.FIELD_WORKERS,
  [SYSTEM_ROLES.DRIVER]: KEYCLOAK_GROUPS.FIELD_WORKERS,
  [SYSTEM_ROLES.LABORER]: KEYCLOAK_GROUPS.FIELD_WORKERS,
  [SYSTEM_ROLES.HELPER]: KEYCLOAK_GROUPS.FIELD_WORKERS,
  [SYSTEM_ROLES.SITE_CLEANER]: KEYCLOAK_GROUPS.FIELD_WORKERS,
  [SYSTEM_ROLES.SECURITY_GUARD]: KEYCLOAK_GROUPS.FIELD_WORKERS,

  // External
  [SYSTEM_ROLES.CONTRACTOR]: KEYCLOAK_GROUPS.CONTRACTORS,
  [SYSTEM_ROLES.SUBCONTRACTOR]: KEYCLOAK_GROUPS.CONTRACTORS,
  [SYSTEM_ROLES.VENDOR]: KEYCLOAK_GROUPS.EXTERNAL,
  [SYSTEM_ROLES.MATERIAL_SUPPLIER]: KEYCLOAK_GROUPS.EXTERNAL,
  [SYSTEM_ROLES.CONSULTANT]: KEYCLOAK_GROUPS.EXTERNAL,
  [SYSTEM_ROLES.OWNER_REPRESENTATIVE]: KEYCLOAK_GROUPS.CLIENTS,
  [SYSTEM_ROLES.CLIENT]: KEYCLOAK_GROUPS.CLIENTS,

  // Office Support (default to management dashboard)
  [SYSTEM_ROLES.ADMIN_STAFF]: KEYCLOAK_GROUPS.MANAGEMENT,
  [SYSTEM_ROLES.DOCUMENT_CONTROLLER]: KEYCLOAK_GROUPS.MANAGEMENT,
  [SYSTEM_ROLES.RECEPTIONIST]: KEYCLOAK_GROUPS.MANAGEMENT,
  [SYSTEM_ROLES.IT_SUPPORT]: KEYCLOAK_GROUPS.MANAGEMENT,
  [SYSTEM_ROLES.OFFICE_ASSISTANT]: KEYCLOAK_GROUPS.MANAGEMENT,

  // Trainees
  [SYSTEM_ROLES.STUDENT]: KEYCLOAK_GROUPS.TRAINEES,
  [SYSTEM_ROLES.INTERN]: KEYCLOAK_GROUPS.TRAINEES,
  [SYSTEM_ROLES.TRAINEE]: KEYCLOAK_GROUPS.TRAINEES,
};

/**
 * Normalize group name from Keycloak token
 *
 * Keycloak sends groups with leading slash (e.g., "/management").
 * This function removes the slash for consistency.
 *
 * @param group - Group path from Keycloak token
 * @returns Normalized group name without leading slash
 */
export function normalizeGroupName(group: string): string {
  // Remove leading slash and convert to lowercase
  return group.replace(/^\/+/, '').toLowerCase();
}

/**
 * Normalize all groups from Keycloak token
 *
 * @param groups - Array of group paths from token
 * @returns Array of normalized group names
 */
export function normalizeGroups(groups: string[]): string[] {
  return groups.map((group) => normalizeGroupName(group));
}

/**
 * Get the primary group for a user based on their groups
 *
 * Uses GROUP_PRIORITY to determine which group takes precedence.
 *
 * @param groups - Normalized group names
 * @returns Primary group or undefined if no matching group
 */
export function getPrimaryGroup(groups: string[]): KeycloakGroup | undefined {
  for (const priorityGroup of GROUP_PRIORITY) {
    if (groups.includes(priorityGroup)) {
      return priorityGroup;
    }
  }
  return undefined;
}

/**
 * Get the primary group for a user based on their roles (fallback)
 *
 * Used when Keycloak groups are not configured or empty.
 *
 * @param roles - User's roles
 * @returns Primary group inferred from roles, or undefined
 */
export function getPrimaryGroupFromRoles(
  roles: string[]
): KeycloakGroup | undefined {
  for (const priorityGroup of GROUP_PRIORITY) {
    // Check if any role maps to this group
    const hasRoleInGroup = roles.some(
      (role) => ROLE_TO_GROUP[role] === priorityGroup
    );
    if (hasRoleInGroup) {
      return priorityGroup;
    }
  }
  return undefined;
}

/**
 * Get the dashboard route for a user
 *
 * Determines the appropriate dashboard based on groups first,
 * falling back to role-based inference if no groups are present.
 *
 * @param groups - User's groups (already normalized)
 * @param roles - User's roles (used as fallback)
 * @returns Dashboard route path
 */
export function getDashboardForUser(groups: string[], roles: string[]): string {
  // Try group-based dashboard first
  const primaryGroup = getPrimaryGroup(groups);
  if (primaryGroup) {
    return GROUP_DASHBOARDS[primaryGroup];
  }

  // Fallback to role-based inference
  const inferredGroup = getPrimaryGroupFromRoles(roles);
  if (inferredGroup) {
    return GROUP_DASHBOARDS[inferredGroup];
  }

  // Default dashboard
  return '/users/dashboard';
}

/**
 * Check if user belongs to a specific group
 *
 * @param userGroups - User's normalized groups
 * @param targetGroup - Group to check for
 * @returns True if user is in the group
 */
export function isInGroup(
  userGroups: string[],
  targetGroup: KeycloakGroup
): boolean {
  return userGroups.includes(targetGroup);
}

/**
 * Check if user belongs to any of the specified groups
 *
 * @param userGroups - User's normalized groups
 * @param targetGroups - Groups to check for (OR logic)
 * @returns True if user is in any of the groups
 */
export function isInAnyGroup(
  userGroups: string[],
  targetGroups: KeycloakGroup[]
): boolean {
  return targetGroups.some((group) => userGroups.includes(group));
}

/**
 * Get group display name
 *
 * @param group - Group identifier
 * @returns Human-readable group name
 */
export function getGroupDisplayName(group: KeycloakGroup): string {
  const displayNames: Record<KeycloakGroup, string> = {
    [KEYCLOAK_GROUPS.ADMIN]: 'Administrators',
    [KEYCLOAK_GROUPS.MANAGEMENT]: 'Management',
    [KEYCLOAK_GROUPS.ENGINEERING]: 'Engineering',
    [KEYCLOAK_GROUPS.FINANCE]: 'Finance',
    [KEYCLOAK_GROUPS.HR]: 'Human Resources',
    [KEYCLOAK_GROUPS.SITE_OPERATIONS]: 'Site Operations',
    [KEYCLOAK_GROUPS.FIELD_WORKERS]: 'Field Workers',
    [KEYCLOAK_GROUPS.EXTERNAL]: 'External Partners',
    [KEYCLOAK_GROUPS.CONTRACTORS]: 'Contractors',
    [KEYCLOAK_GROUPS.CLIENTS]: 'Clients',
    [KEYCLOAK_GROUPS.TRAINEES]: 'Trainees',
  };

  return displayNames[group] || group;
}
