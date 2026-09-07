import { OrgRole } from '@tornotron/echno-core/employee/types';

/**
 * The organisation roles the Assign Role dialog offers.
 *
 * Two different enums are named `OrgRole` and they are not the same set, which
 * is the whole difficulty here. echno-core's is the job-family vocabulary
 * carried on `Employee.orgRoles`: Mason, Welder, Driver, Intern and forty-odd
 * others. The backend's (`common/enums/OrgRole.java`) is the set of Keycloak
 * subgroups an organisation has, and it is the only one the assign-role
 * endpoint will parse. So this list cannot be derived from echno-core's enum:
 * deriving it from there is the bug d8f1e1df fixed, where picking Mason reached
 * an endpoint that had no group for it and answered with a raw enum-parse
 * message naming every member.
 *
 * The list is therefore derived from {@link BACKEND_ORG_ROLES}, which mirrors
 * the backend enum, through {@link ORG_ROLE_POLICY}, which says what to do with
 * each of them. A role added to the mirror and not given a policy does not
 * compile, so the list can no longer fall a role behind the way it did between
 * d8f1e1df and issue #422.
 */

/**
 * The backend's `OrgRole`, as the wire strings it parses.
 *
 * This is the ground truth for the dialog. Verified against echno-backend
 * `docs/openapi.json`, where the assign-role request body declares exactly
 * these eight; the endpoint applies no further filter, and
 * `KeycloakGroupService.ensureRoleSubgroup` creates the `/org-{id}/{role}`
 * subgroup on first assignment, so none of them needs pre-creating.
 *
 * Nothing generates this from the Java enum. When the backend gains a role, add
 * it here and place it in one of the two buckets below. Re-read the source with:
 *
 *   jq -c '[.. | objects | select(has("enum"))
 *          | select(.enum | index("STORE_KEEPER")) | .enum] | unique' \
 *     ../echno-backend/docs/openapi.json
 */
export const BACKEND_ORG_ROLES = [
  'SYSTEM_ADMIN',
  'ORG_MANAGER',
  'HR_ADMIN',
  'PROJECT_MANAGER',
  'QA_ENGINEER',
  'SAFETY_OFFICER',
  'SITE_ENGINEER',
  'STORE_KEEPER',
] as const;

type BackendOrgRole = (typeof BACKEND_ORG_ROLES)[number];

/** Offer the role in the dialog, or hold it back for the reason given. */
type OrgRolePolicy = 'offer' | { readonly withheld: string };

/**
 * What the Assign Role dialog does with each backend org role.
 *
 * The record is total over {@link BACKEND_ORG_ROLES}, which is the point: a
 * role added to the mirror and not given an entry here is a type error, so the
 * decision cannot be deferred by accident. Withholding is the exception and has
 * to argue for itself. "We have not got round to it" is not a reason, it is the
 * bug this file exists to stop recurring.
 */
export const ORG_ROLE_POLICY: Record<BackendOrgRole, OrgRolePolicy> = {
  SYSTEM_ADMIN: 'offer',
  HR_ADMIN: 'offer',
  PROJECT_MANAGER: 'offer',
  SAFETY_OFFICER: 'offer',
  SITE_ENGINEER: 'offer',
  STORE_KEEPER: 'offer',
  ORG_MANAGER: {
    withheld:
      'Declared but never pressed into service. echno-backend #650 looked at ' +
      'using it and chose not to, so no endpoint reads the authority it ' +
      'grants and a person put in the subgroup would gain nothing. ' +
      'echno-core has no member for it either, so it would have no label.',
  },
  QA_ENGINEER: {
    withheld:
      'Not offered yet because echno-core has no member for it, so it would ' +
      'appear under its raw wire string and read false in every core ' +
      'permission helper. Offer it once core carries it, the way ' +
      'STORE_KEEPER was carried across.',
  },
};

/** The reason a backend org role is held back, or `undefined` if it is offered. */
export function withheldReason(role: string): string | undefined {
  const policy = ORG_ROLE_POLICY[role as BackendOrgRole];
  return policy !== undefined && policy !== 'offer' ? policy.withheld : undefined;
}

/**
 * The roles the assign-role endpoint accepts and this dialog is willing to
 * offer, in {@link BACKEND_ORG_ROLES} order.
 *
 * Built from the wire strings rather than from echno-core enum members on
 * purpose: the endpoint parses the string, and a role the backend accepts must
 * be grantable here even in the window before core has caught up with it.
 * STORE_KEEPER spent that window unreachable, which is issue #422.
 */
export const ASSIGNABLE_ORG_ROLES: readonly OrgRole[] = BACKEND_ORG_ROLES.filter(
  (role) => ORG_ROLE_POLICY[role] === 'offer'
).map((role) => role as OrgRole);

const ASSIGNABLE = new Set<string>(ASSIGNABLE_ORG_ROLES);

/**
 * The roles still on offer for an employee: the assignable set less whatever
 * the employee already holds, in {@link ASSIGNABLE_ORG_ROLES} order so the
 * dialog always lists them the same way.
 *
 * Takes the roles held rather than the roles free. The free list from
 * `useRoleManagement` is every echno-core job family the employee lacks, which
 * cannot name a backend role core has not carried across yet, and intersecting
 * with it silently dropped exactly the role this dialog most needed to offer.
 */
export function assignableOrgRoles(currentRoles: readonly OrgRole[]): OrgRole[] {
  const held = new Set<string>(currentRoles);
  return ASSIGNABLE_ORG_ROLES.filter((role) => !held.has(role));
}

/** Whether a role is one the assign-role endpoint accepts and we offer. */
export function isAssignableOrgRole(role: OrgRole): boolean {
  return ASSIGNABLE.has(role);
}
