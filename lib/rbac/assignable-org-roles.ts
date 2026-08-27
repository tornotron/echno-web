import { OrgRole } from '@tornotron/echno-core/employee/types';

/**
 * The organisation roles `POST /keycloakGroup/web/assignRole` will accept.
 *
 * `OrgRole` in echno-core is the wide job-family vocabulary carried on
 * `Employee.orgRoles` (Mason, Site Manager, Safety Officer, and forty-odd
 * others). The backend's own `OrgRole` enum is a much narrower thing: the set
 * of Keycloak subgroups an organisation actually has, which is what the
 * assign-role endpoint parses its request into. Offering the whole job-family
 * list in the Assign Role dialog let a user pick a value the endpoint has no
 * group for, and it answered with the raw enum-parse failure.
 *
 * Keep this in step with `OrgRole` in echno-backend
 * (`common/enums/OrgRole.java`). `ORG_MANAGER` is missing here because
 * echno-core's enum has no member for it, so the UI cannot express it yet.
 */
export const ASSIGNABLE_ORG_ROLES: readonly OrgRole[] = [
  OrgRole.SYSTEM_ADMIN,
  OrgRole.HR_ADMIN,
  OrgRole.PROJECT_MANAGER,
];

const ASSIGNABLE = new Set<OrgRole>(ASSIGNABLE_ORG_ROLES);

/**
 * Narrows a list of roles to the ones the backend can actually assign,
 * preserving {@link ASSIGNABLE_ORG_ROLES} order so the dialog always lists
 * them the same way.
 */
export function assignableOrgRoles(roles: readonly OrgRole[]): OrgRole[] {
  const offered = new Set(roles);
  return ASSIGNABLE_ORG_ROLES.filter((role) => offered.has(role));
}

/** Whether a role is one the assign-role endpoint accepts. */
export function isAssignableOrgRole(role: OrgRole): boolean {
  return ASSIGNABLE.has(role);
}
