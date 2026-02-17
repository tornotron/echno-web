/**
 * Role interface for RBAC
 * Note: Permissions are now managed via Keycloak Authorization Services
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  isSystemRole: boolean; // Cannot be deleted or modified
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * System role identifiers
 */
export const SYSTEM_ROLES = {
  // ==================== Administration ====================
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',

  // ==================== Management Roles ====================
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  SITE_MANAGER: 'SITE_MANAGER',
  HR_MANAGER: 'HR_MANAGER',
  DIRECTOR: 'DIRECTOR',

  // ==================== Engineering & Technical ====================
  CIVIL_ENGINEER: 'CIVIL_ENGINEER',
  SITE_ENGINEER: 'SITE_ENGINEER',
  STRUCTURAL_ENGINEER: 'STRUCTURAL_ENGINEER',
  ARCHITECT: 'ARCHITECT',
  PLANNING_ENGINEER: 'PLANNING_ENGINEER',
  TECHNICAL_COORDINATOR: 'TECHNICAL_COORDINATOR',

  // ==================== Finance & Admin ====================
  ACCOUNTANT: 'ACCOUNTANT',
  QUANTITY_SURVEYOR: 'QUANTITY_SURVEYOR',
  PROCUREMENT_OFFICER: 'PROCUREMENT_OFFICER',
  ADMIN_STAFF: 'ADMIN_STAFF',
  DOCUMENT_CONTROLLER: 'DOCUMENT_CONTROLLER',

  // ==================== Supervisory ====================
  SUPERVISOR: 'SUPERVISOR',
  FOREMAN: 'FOREMAN',
  SAFETY_OFFICER: 'SAFETY_OFFICER',

  // ==================== Skilled Workers ====================
  ELECTRICIAN: 'ELECTRICIAN',
  PLUMBER: 'PLUMBER',
  CARPENTER: 'CARPENTER',
  MASON: 'MASON',
  WELDER: 'WELDER',
  PAINTER: 'PAINTER',
  SCAFFOLDER: 'SCAFFOLDER',

  // ==================== Equipment Operators ====================
  EQUIPMENT_OPERATOR: 'EQUIPMENT_OPERATOR',
  CRANE_OPERATOR: 'CRANE_OPERATOR',
  DRIVER: 'DRIVER',

  // ==================== General Workers ====================
  LABORER: 'LABORER',
  HELPER: 'HELPER',
  SITE_CLEANER: 'SITE_CLEANER',
  SECURITY_GUARD: 'SECURITY_GUARD',

  // ==================== Third Party ====================
  CONTRACTOR: 'CONTRACTOR',
  SUBCONTRACTOR: 'SUBCONTRACTOR',
  MATERIAL_SUPPLIER: 'MATERIAL_SUPPLIER',
  VENDOR: 'VENDOR',
  CONSULTANT: 'CONSULTANT',
  OWNER_REPRESENTATIVE: 'OWNER_REPRESENTATIVE',
  CLIENT: 'CLIENT',

  // ==================== Office Support ====================
  RECEPTIONIST: 'RECEPTIONIST',
  IT_SUPPORT: 'IT_SUPPORT',
  OFFICE_ASSISTANT: 'OFFICE_ASSISTANT',

  // ==================== Trainees ====================
  STUDENT: 'STUDENT',
  INTERN: 'INTERN',
  TRAINEE: 'TRAINEE',
} as const;

export type SystemRoleKey = keyof typeof SYSTEM_ROLES;
export type SystemRoleValue = (typeof SYSTEM_ROLES)[SystemRoleKey];

/**
 * User role assignment
 */
export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date; // Optional: time-limited roles
  organizationId?: string; // Optional: org-specific roles
  isActive: boolean;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(roleId: string): string {
  const names: Record<string, string> = {
    // Admin
    [SYSTEM_ROLES.SYSTEM_ADMIN]: 'System Administrator',

    // Management
    [SYSTEM_ROLES.PROJECT_MANAGER]: 'Project Manager',
    [SYSTEM_ROLES.SITE_MANAGER]: 'Site Manager',
    [SYSTEM_ROLES.HR_MANAGER]: 'HR Manager',
    [SYSTEM_ROLES.DIRECTOR]: 'Director',

    // Engineering
    [SYSTEM_ROLES.CIVIL_ENGINEER]: 'Civil Engineer',
    [SYSTEM_ROLES.SITE_ENGINEER]: 'Site Engineer',
    [SYSTEM_ROLES.STRUCTURAL_ENGINEER]: 'Structural Engineer',
    [SYSTEM_ROLES.ARCHITECT]: 'Architect',
    [SYSTEM_ROLES.PLANNING_ENGINEER]: 'Planning Engineer',
    [SYSTEM_ROLES.TECHNICAL_COORDINATOR]: 'Technical Coordinator',

    // Finance
    [SYSTEM_ROLES.ACCOUNTANT]: 'Accountant',
    [SYSTEM_ROLES.QUANTITY_SURVEYOR]: 'Quantity Surveyor',
    [SYSTEM_ROLES.PROCUREMENT_OFFICER]: 'Procurement Officer',
    [SYSTEM_ROLES.ADMIN_STAFF]: 'Admin Staff',
    [SYSTEM_ROLES.DOCUMENT_CONTROLLER]: 'Document Controller',

    // Supervisory
    [SYSTEM_ROLES.SUPERVISOR]: 'Supervisor',
    [SYSTEM_ROLES.FOREMAN]: 'Foreman',
    [SYSTEM_ROLES.SAFETY_OFFICER]: 'Safety Officer',

    // Skilled Workers
    [SYSTEM_ROLES.ELECTRICIAN]: 'Electrician',
    [SYSTEM_ROLES.PLUMBER]: 'Plumber',
    [SYSTEM_ROLES.CARPENTER]: 'Carpenter',
    [SYSTEM_ROLES.MASON]: 'Mason',
    [SYSTEM_ROLES.WELDER]: 'Welder',
    [SYSTEM_ROLES.PAINTER]: 'Painter',
    [SYSTEM_ROLES.SCAFFOLDER]: 'Scaffolder',

    // Equipment Operators
    [SYSTEM_ROLES.EQUIPMENT_OPERATOR]: 'Equipment Operator',
    [SYSTEM_ROLES.CRANE_OPERATOR]: 'Crane Operator',
    [SYSTEM_ROLES.DRIVER]: 'Driver',

    // General Workers
    [SYSTEM_ROLES.LABORER]: 'Laborer',
    [SYSTEM_ROLES.HELPER]: 'Helper',
    [SYSTEM_ROLES.SITE_CLEANER]: 'Site Cleaner',
    [SYSTEM_ROLES.SECURITY_GUARD]: 'Security Guard',

    // Third Party
    [SYSTEM_ROLES.CONTRACTOR]: 'Contractor',
    [SYSTEM_ROLES.SUBCONTRACTOR]: 'Subcontractor',
    [SYSTEM_ROLES.MATERIAL_SUPPLIER]: 'Material Supplier',
    [SYSTEM_ROLES.VENDOR]: 'Vendor',
    [SYSTEM_ROLES.CONSULTANT]: 'Consultant',
    [SYSTEM_ROLES.OWNER_REPRESENTATIVE]: 'Owner Representative',
    [SYSTEM_ROLES.CLIENT]: 'Client',

    // Office Support
    [SYSTEM_ROLES.RECEPTIONIST]: 'Receptionist',
    [SYSTEM_ROLES.IT_SUPPORT]: 'IT Support',
    [SYSTEM_ROLES.OFFICE_ASSISTANT]: 'Office Assistant',

    // Trainees
    [SYSTEM_ROLES.STUDENT]: 'Student',
    [SYSTEM_ROLES.INTERN]: 'Intern',
    [SYSTEM_ROLES.TRAINEE]: 'Trainee',
  };

  return names[roleId] || roleId;
}

/**
 * Get all system roles as array
 */
export function getAllSystemRoles(): string[] {
  return Object.values(SYSTEM_ROLES);
}

/**
 * Check if role is a system role
 */
export function isSystemRole(roleId: string): boolean {
  return getAllSystemRoles().includes(roleId);
}

/**
 * Role hierarchy levels (for display and organization)
 */
export enum RoleLevel {
  ADMIN = 'admin',
  MANAGEMENT = 'management',
  PROFESSIONAL = 'professional',
  SUPERVISORY = 'supervisory',
  SKILLED = 'skilled',
  GENERAL = 'general',
  EXTERNAL = 'external',
  TRAINEE = 'trainee',
}

/**
 * Get role level
 */
export function getRoleLevel(roleId: string): RoleLevel {
  if (roleId === SYSTEM_ROLES.SYSTEM_ADMIN) return RoleLevel.ADMIN;

  const managementRoles: string[] = [
    SYSTEM_ROLES.PROJECT_MANAGER,
    SYSTEM_ROLES.SITE_MANAGER,
    SYSTEM_ROLES.HR_MANAGER,
  ];
  if (managementRoles.includes(roleId)) {
    return RoleLevel.MANAGEMENT;
  }

  const professionalRoles: string[] = [
    SYSTEM_ROLES.CIVIL_ENGINEER,
    SYSTEM_ROLES.SITE_ENGINEER,
    SYSTEM_ROLES.STRUCTURAL_ENGINEER,
    SYSTEM_ROLES.ARCHITECT,
    SYSTEM_ROLES.PLANNING_ENGINEER,
    SYSTEM_ROLES.TECHNICAL_COORDINATOR,
    SYSTEM_ROLES.ACCOUNTANT,
    SYSTEM_ROLES.QUANTITY_SURVEYOR,
    SYSTEM_ROLES.PROCUREMENT_OFFICER,
  ];
  if (professionalRoles.includes(roleId)) {
    return RoleLevel.PROFESSIONAL;
  }

  const supervisoryRoles: string[] = [
    SYSTEM_ROLES.SUPERVISOR,
    SYSTEM_ROLES.FOREMAN,
    SYSTEM_ROLES.SAFETY_OFFICER,
  ];
  if (supervisoryRoles.includes(roleId)) {
    return RoleLevel.SUPERVISORY;
  }

  const skilledRoles: string[] = [
    SYSTEM_ROLES.ELECTRICIAN,
    SYSTEM_ROLES.PLUMBER,
    SYSTEM_ROLES.CARPENTER,
    SYSTEM_ROLES.MASON,
    SYSTEM_ROLES.WELDER,
    SYSTEM_ROLES.PAINTER,
    SYSTEM_ROLES.SCAFFOLDER,
    SYSTEM_ROLES.EQUIPMENT_OPERATOR,
    SYSTEM_ROLES.CRANE_OPERATOR,
    SYSTEM_ROLES.DRIVER,
  ];
  if (skilledRoles.includes(roleId)) {
    return RoleLevel.SKILLED;
  }

  const externalRoles: string[] = [
    SYSTEM_ROLES.CONTRACTOR,
    SYSTEM_ROLES.SUBCONTRACTOR,
    SYSTEM_ROLES.MATERIAL_SUPPLIER,
    SYSTEM_ROLES.VENDOR,
    SYSTEM_ROLES.CONSULTANT,
    SYSTEM_ROLES.OWNER_REPRESENTATIVE,
    SYSTEM_ROLES.CLIENT,
  ];
  if (externalRoles.includes(roleId)) {
    return RoleLevel.EXTERNAL;
  }

  const traineeRoles: string[] = [
    SYSTEM_ROLES.STUDENT,
    SYSTEM_ROLES.INTERN,
    SYSTEM_ROLES.TRAINEE,
  ];
  if (traineeRoles.includes(roleId)) {
    return RoleLevel.TRAINEE;
  }

  return RoleLevel.GENERAL;
}
