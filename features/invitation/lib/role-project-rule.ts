/**
 * Which roles an invitation can give on one project.
 *
 * A role is held on a project or, with none, across the organization. While
 * the old role checks still run, a role that has a counterpart among the old
 * organization roles holds across the organization only: the old checks know
 * nothing of projects, so a project assignment would either grant the role
 * everywhere or leave the two checks disagreeing. The backend refuses a
 * project on such a role (echno-backend `MatrixRoleAssignments`, design note
 * 2.7), and the form does not offer one, saying why.
 *
 * The role list (`AccessRole`) does not say which roles have a counterpart, so
 * the set is kept here by slug. A slug never changes on rename, and only the
 * starting role templates carry a counterpart, so the set is fixed until the
 * old roles go. It mirrors the `legacy_org_role` column of the backend's
 * `db/data/access/role-templates.csv`. Once the role list carries the field,
 * this set goes and `refusesProject` reads it.
 */

import { ApiError } from '@tornotron/echno-core';
import type { AccessRole } from '@tornotron/echno-core/access/types';
import type { MemberInvitationRole } from '@tornotron/echno-core/member-invitations/types';

/** Slugs of the starting roles that have a counterpart among the old roles. */
export const ORGANIZATION_WIDE_ROLE_SLUGS: ReadonlySet<string> = new Set([
  'system-admin',
  'project-manager',
  'site-engineer',
  'qa-qc-engineer',
  'store-keeper',
  'hr-admin',
  'safety-officer',
  'org-manager',
  'observation-producer',
]);

/** Shown beside a role that cannot be given on one project. */
export const ORGANIZATION_WIDE_NOTE =
  'Holds across the organization for now. It still has a counterpart among the old roles, which have no idea of a project, so it cannot be given on one project yet.';

/** What the backend says when a project is sent for such a role. */
const PROJECT_REFUSED_MARKER = 'cannot be given on one project';

/** Whether a role must be given across the organization, never on one project. */
export function refusesProject(role: Pick<AccessRole, 'slug'>): boolean {
  return ORGANIZATION_WIDE_ROLE_SLUGS.has(role.slug);
}

/**
 * The roles an invitation can offer. The baseline role is left out: every
 * member holds it without being given it.
 */
export function invitableRoles(roles: AccessRole[]): AccessRole[] {
  return roles.filter((role) => !role.baseline);
}

/** One role ticked on the form, with the project chosen for it, if any. */
export interface RoleSelection {
  roleId: string;
  /** A project id, or absent for across the organization. */
  projectId?: number;
}

/**
 * Turns the form's selections into the request's roles. A role that refuses a
 * project is always sent across the organization, whatever the selection
 * holds, and a selection whose role is not in the list is dropped.
 */
export function toInvitationRoles(
  selections: RoleSelection[],
  roles: AccessRole[]
): MemberInvitationRole[] {
  const byId = new Map(roles.map((role) => [role.id, role]));
  const result: MemberInvitationRole[] = [];
  for (const selection of selections) {
    const role = byId.get(selection.roleId);
    if (!role) continue;
    result.push(
      selection.projectId === undefined || refusesProject(role)
        ? { roleId: role.id }
        : { roleId: role.id, projectId: selection.projectId }
    );
  }
  return result;
}

/**
 * Whether a failed request is the backend refusing a project on such a role,
 * so it can be shown with the roles rather than as a generic error.
 */
export function isProjectRefusal(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 400) return false;
  return `${error.message ?? ''} ${error.details ?? ''}`.includes(
    PROJECT_REFUSED_MARKER
  );
}
