/**
 * OrgRole enum — all organization roles matching backend UPPERCASE_SNAKE_CASE format.
 *
 * These are the authorization roles assigned to employees via `employee.orgRoles`.
 * Values match exactly what the backend sends/expects.
 */
export enum OrgRole {
  // General Workers
  LABORER = 'LABORER',
  HELPER = 'HELPER',
  SITE_CLEANER = 'SITE_CLEANER',
  SECURITY_GUARD = 'SECURITY_GUARD',

  // Skilled Workers
  ELECTRICIAN = 'ELECTRICIAN',
  PLUMBER = 'PLUMBER',
  CARPENTER = 'CARPENTER',
  MASON = 'MASON',
  WELDER = 'WELDER',
  PAINTER = 'PAINTER',
  SCAFFOLDER = 'SCAFFOLDER',

  // Equipment Operators
  EQUIPMENT_OPERATOR = 'EQUIPMENT_OPERATOR',
  CRANE_OPERATOR = 'CRANE_OPERATOR',
  DRIVER = 'DRIVER',

  // Office & Admin
  HR_ADMIN = 'HR_ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  ADMIN_STAFF = 'ADMIN_STAFF',
  RECEPTIONIST = 'RECEPTIONIST',
  DOCUMENT_CONTROLLER = 'DOCUMENT_CONTROLLER',
  IT_SUPPORT = 'IT_SUPPORT',
  OFFICE_ASSISTANT = 'OFFICE_ASSISTANT',

  // Leadership
  DIRECTOR = 'DIRECTOR',
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',

  // Engineering & Technical
  CIVIL_ENGINEER = 'CIVIL_ENGINEER',
  SITE_ENGINEER = 'SITE_ENGINEER',
  STRUCTURAL_ENGINEER = 'STRUCTURAL_ENGINEER',
  ARCHITECT = 'ARCHITECT',
  QUANTITY_SURVEYOR = 'QUANTITY_SURVEYOR',
  SAFETY_OFFICER = 'SAFETY_OFFICER',
  PLANNING_ENGINEER = 'PLANNING_ENGINEER',
  TECHNICAL_COORDINATOR = 'TECHNICAL_COORDINATOR',

  // Management & Supervisory
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  SITE_MANAGER = 'SITE_MANAGER',
  SITE_SUPERVISOR = 'SITE_SUPERVISOR',
  SUPERVISOR = 'SUPERVISOR',
  FOREMAN = 'FOREMAN',

  // Third Party
  CONTRACTOR = 'CONTRACTOR',
  SUB_CONTRACTOR = 'SUB_CONTRACTOR',
  MATERIAL_SUPPLIER = 'MATERIAL_SUPPLIER',
  PROCUREMENT_OFFICER = 'PROCUREMENT_OFFICER',
  VENDOR = 'VENDOR',
  CONSULTANT = 'CONSULTANT',
  OWNER_REPRESENTATIVE = 'OWNER_REPRESENTATIVE',
  CLIENT = 'CLIENT',

  // Trainees
  STUDENT = 'STUDENT',
  INTERN = 'INTERN',
  TRAINEE = 'TRAINEE',
}

const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  [OrgRole.LABORER]: 'Laborer',
  [OrgRole.HELPER]: 'Helper',
  [OrgRole.SITE_CLEANER]: 'Site Cleaner',
  [OrgRole.SECURITY_GUARD]: 'Security Guard',
  [OrgRole.ELECTRICIAN]: 'Electrician',
  [OrgRole.PLUMBER]: 'Plumber',
  [OrgRole.CARPENTER]: 'Carpenter',
  [OrgRole.MASON]: 'Mason',
  [OrgRole.WELDER]: 'Welder',
  [OrgRole.PAINTER]: 'Painter',
  [OrgRole.SCAFFOLDER]: 'Scaffolder',
  [OrgRole.EQUIPMENT_OPERATOR]: 'Equipment Operator',
  [OrgRole.CRANE_OPERATOR]: 'Crane Operator',
  [OrgRole.DRIVER]: 'Driver',
  [OrgRole.HR_ADMIN]: 'HR Manager',
  [OrgRole.ACCOUNTANT]: 'Accountant',
  [OrgRole.ADMIN_STAFF]: 'Admin Staff',
  [OrgRole.RECEPTIONIST]: 'Receptionist',
  [OrgRole.DOCUMENT_CONTROLLER]: 'Document Controller',
  [OrgRole.IT_SUPPORT]: 'IT Support',
  [OrgRole.OFFICE_ASSISTANT]: 'Office Assistant',
  [OrgRole.DIRECTOR]: 'Director',
  [OrgRole.SYSTEM_ADMIN]: 'System Administrator',
  [OrgRole.CIVIL_ENGINEER]: 'Civil Engineer',
  [OrgRole.SITE_ENGINEER]: 'Site Engineer',
  [OrgRole.STRUCTURAL_ENGINEER]: 'Structural Engineer',
  [OrgRole.ARCHITECT]: 'Architect',
  [OrgRole.QUANTITY_SURVEYOR]: 'Quantity Surveyor',
  [OrgRole.SAFETY_OFFICER]: 'Safety Officer',
  [OrgRole.PLANNING_ENGINEER]: 'Planning Engineer',
  [OrgRole.TECHNICAL_COORDINATOR]: 'Technical Coordinator',
  [OrgRole.PROJECT_MANAGER]: 'Project Manager',
  [OrgRole.SITE_MANAGER]: 'Site Manager',
  [OrgRole.SITE_SUPERVISOR]: 'Site Supervisor',
  [OrgRole.SUPERVISOR]: 'Supervisor',
  [OrgRole.FOREMAN]: 'Foreman',
  [OrgRole.CONTRACTOR]: 'Contractor',
  [OrgRole.SUB_CONTRACTOR]: 'Sub Contractor',
  [OrgRole.MATERIAL_SUPPLIER]: 'Material Supplier',
  [OrgRole.PROCUREMENT_OFFICER]: 'Procurement Officer',
  [OrgRole.VENDOR]: 'Vendor',
  [OrgRole.CONSULTANT]: 'Consultant',
  [OrgRole.OWNER_REPRESENTATIVE]: 'Owner Representative',
  [OrgRole.CLIENT]: 'Client',
  [OrgRole.STUDENT]: 'Student',
  [OrgRole.INTERN]: 'Intern',
  [OrgRole.TRAINEE]: 'Trainee',
};

// ==================== Role Groups ====================

/** System admin and director-level roles */
export const ADMIN_ROLES: ReadonlySet<OrgRole> = new Set([
  OrgRole.SYSTEM_ADMIN,
  OrgRole.DIRECTOR,
]);

/** Managerial roles that can approve, assign, and oversee teams */
export const MANAGER_ROLES: ReadonlySet<OrgRole> = new Set([
  OrgRole.PROJECT_MANAGER,
  OrgRole.SITE_MANAGER,
  OrgRole.HR_ADMIN,
]);

/** Supervisory roles that oversee day-to-day work on site */
export const SUPERVISOR_ROLES: ReadonlySet<OrgRole> = new Set([
  OrgRole.SITE_SUPERVISOR,
  OrgRole.SUPERVISOR,
  OrgRole.FOREMAN,
]);

/** Engineering and technical specialist roles */
export const ENGINEERING_ROLES: ReadonlySet<OrgRole> = new Set([
  OrgRole.CIVIL_ENGINEER,
  OrgRole.SITE_ENGINEER,
  OrgRole.STRUCTURAL_ENGINEER,
  OrgRole.ARCHITECT,
  OrgRole.QUANTITY_SURVEYOR,
  OrgRole.SAFETY_OFFICER,
  OrgRole.PLANNING_ENGINEER,
  OrgRole.TECHNICAL_COORDINATOR,
]);

/** Safety and quality inspection roles */
export const INSPECTOR_ROLES: ReadonlySet<OrgRole> = new Set([
  OrgRole.SAFETY_OFFICER,
  OrgRole.QUANTITY_SURVEYOR,
]);

/** All remaining roles that don't fall into a privileged group */
export const NORMAL_ROLES: ReadonlySet<OrgRole> = new Set([
  OrgRole.LABORER,
  OrgRole.HELPER,
  OrgRole.SITE_CLEANER,
  OrgRole.SECURITY_GUARD,
  OrgRole.ELECTRICIAN,
  OrgRole.PLUMBER,
  OrgRole.CARPENTER,
  OrgRole.MASON,
  OrgRole.WELDER,
  OrgRole.PAINTER,
  OrgRole.SCAFFOLDER,
  OrgRole.EQUIPMENT_OPERATOR,
  OrgRole.CRANE_OPERATOR,
  OrgRole.DRIVER,
  OrgRole.ACCOUNTANT,
  OrgRole.ADMIN_STAFF,
  OrgRole.RECEPTIONIST,
  OrgRole.DOCUMENT_CONTROLLER,
  OrgRole.IT_SUPPORT,
  OrgRole.OFFICE_ASSISTANT,
  OrgRole.CONTRACTOR,
  OrgRole.SUB_CONTRACTOR,
  OrgRole.MATERIAL_SUPPLIER,
  OrgRole.PROCUREMENT_OFFICER,
  OrgRole.VENDOR,
  OrgRole.CONSULTANT,
  OrgRole.OWNER_REPRESENTATIVE,
  OrgRole.CLIENT,
  OrgRole.STUDENT,
  OrgRole.INTERN,
  OrgRole.TRAINEE,
]);

// ==================== Group Check Helpers ====================

/** Check if any of the user's roles belong to a given group. */
function hasRoleInGroup(
  roles: string[] | undefined,
  group: ReadonlySet<OrgRole>
): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.some((r) => group.has(r as OrgRole));
}

export const isAdmin = (roles: string[] | undefined) =>
  hasRoleInGroup(roles, ADMIN_ROLES);
export const isManager = (roles: string[] | undefined) =>
  hasRoleInGroup(roles, MANAGER_ROLES);
export const isSupervisor = (roles: string[] | undefined) =>
  hasRoleInGroup(roles, SUPERVISOR_ROLES);
export const isEngineer = (roles: string[] | undefined) =>
  hasRoleInGroup(roles, ENGINEERING_ROLES);
export const isInspector = (roles: string[] | undefined) =>
  hasRoleInGroup(roles, INSPECTOR_ROLES);

/** Check if user has at least manager-level access (admin OR manager). */
export const isManagerOrAbove = (roles: string[] | undefined) =>
  isAdmin(roles) || isManager(roles);

/** Check if user has at least supervisor-level access (admin OR manager OR supervisor). */
export const isSupervisorOrAbove = (roles: string[] | undefined) =>
  isAdmin(roles) || isManager(roles) || isSupervisor(roles);

// ==================== Labels & Parsing ====================

/** Get the human-readable display name for a role. */
export function getOrgRoleLabel(role: OrgRole): string {
  return ORG_ROLE_LABELS[role] ?? role;
}

/** Safely parse a string into an OrgRole, returning undefined if not recognised. */
export function orgRoleFromString(str: string): OrgRole | undefined {
  const values = Object.values(OrgRole) as string[];
  return values.includes(str) ? (str as OrgRole) : undefined;
}
