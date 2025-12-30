/**
 * Role Normalizer
 *
 * Converts Keycloak role names (hyphenated) to application role names (camelCase)
 * This allows Keycloak to use human-readable role names like "project-manager"
 * while the application uses camelCase like "projectManager"
 */

/**
 * Convert hyphenated role name to camelCase
 * Examples:
 * - "project-manager" → "projectManager"
 * - "super-admin" → "superAdmin"
 * - "hr-manager" → "hrManager"
 * - "civil-engineer" → "civilEngineer"
 */
export function normalizeRoleName(keycloakRole: string): string {
  return keycloakRole.replaceAll(/-([a-z])/g, (_, letter) =>
    letter.toUpperCase()
  );
}

/**
 * Normalize an array of role names
 */
export function normalizeRoles(keycloakRoles: string[]): string[] {
  return keycloakRoles.map((role) => normalizeRoleName(role));
}

/**
 * Reverse mapping for denormalization (app format → Keycloak format)
 */
const REVERSE_ROLE_MAPPING: Record<string, string> = {
  super_admin: 'super-admin',
  // Add other special cases if needed
};

/**
 * Convert camelCase role name back to hyphenated (for Keycloak API calls)
 * Examples:
 * - "projectManager" → "project-manager"
 * - "superAdmin" → "super-admin"
 * - "hrManager" → "hr-manager"
 * - "super_admin" → "super-admin" (special case)
 */
export function denormalizeRoleName(appRole: string): string {
  // Check reverse mapping first for special cases
  if (REVERSE_ROLE_MAPPING[appRole]) {
    return REVERSE_ROLE_MAPPING[appRole];
  }

  return appRole.replaceAll(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Denormalize an array of role names
 */
export function denormalizeRoles(appRoles: string[]): string[] {
  return appRoles.map((role) => denormalizeRoleName(role));
}

/**
 * Mapping of common role names for validation
 * This helps catch any roles that don't follow the standard pattern
 */
export const ROLE_NAME_MAPPING: Record<string, string> = {
  // Special cases (if any)
  'super-admin': 'super_admin', // Note: uses underscore in app

  // Standard mappings (hyphen to camelCase)
  'project-manager': 'projectManager',
  'site-manager': 'siteManager',
  'hr-manager': 'hrManager',
  'civil-engineer': 'civilEngineer',
  'site-engineer': 'siteEngineer',
  'structural-engineer': 'structuralEngineer',
  'planning-engineer': 'planningEngineer',
  'technical-coordinator': 'technicalCoordinator',
  'quantity-surveyor': 'quantitySurveyor',
  'procurement-officer': 'procurementOfficer',
  'admin-staff': 'adminStaff',
  'document-controller': 'documentController',
  'safety-officer': 'safetyOfficer',
  'equipment-operator': 'equipmentOperator',
  'crane-operator': 'craneOperator',
  'site-cleaner': 'siteCleaner',
  'security-guard': 'securityGuard',
  'material-supplier': 'materialSupplier',
  'owner-representative': 'ownerRepresentative',
  'it-support': 'itSupport',
  'office-assistant': 'officeAssistant',

  // Single-word roles (no change needed)
  architect: 'architect',
  supervisor: 'supervisor',
  foreman: 'foreman',
  electrician: 'electrician',
  plumber: 'plumber',
  carpenter: 'carpenter',
  mason: 'mason',
  welder: 'welder',
  painter: 'painter',
  scaffolder: 'scaffolder',
  driver: 'driver',
  laborer: 'laborer',
  helper: 'helper',
  contractor: 'contractor',
  subcontractor: 'subcontractor',
  vendor: 'vendor',
  consultant: 'consultant',
  client: 'client',
  receptionist: 'receptionist',
  student: 'student',
  intern: 'intern',
  trainee: 'trainee',
  accountant: 'accountant',
};

/**
 * Normalize role using mapping table (handles special cases)
 * Falls back to automatic conversion if not in mapping
 */
export function normalizeRoleWithMapping(keycloakRole: string): string {
  return ROLE_NAME_MAPPING[keycloakRole] || normalizeRoleName(keycloakRole);
}

/**
 * Normalize roles using mapping table
 */
export function normalizeRolesWithMapping(keycloakRoles: string[]): string[] {
  return keycloakRoles.map((role) => normalizeRoleWithMapping(role));
}
