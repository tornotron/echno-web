'use client';

import { useMemo } from 'react';
import { useAccessRoles } from '@tornotron/echno-core/access/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import type { MemberInvitationRole } from '@tornotron/echno-core/member-invitations/types';

/**
 * Names for the role and project ids an invitation carries. An id the lists
 * do not hold (still loading, or the role list not answering) reads as a
 * plain placeholder, never as another role's name.
 */
export function useInvitationNames() {
  const { data: roles = [] } = useAccessRoles();
  const { data: projects = [] } = useProjects();

  return useMemo(() => {
    const roleNames = new Map(roles.map((role) => [role.id, role.name]));
    const projectNames = new Map(
      projects.map((project) => [project.id, project.projectName])
    );
    const roleName = (id: string) => roleNames.get(id) ?? 'Unnamed role';
    const projectName = (id: number) => projectNames.get(id) ?? `Project ${id}`;
    const describe = (role: MemberInvitationRole) =>
      role.projectId === undefined
        ? `${roleName(role.roleId)}, across the organization`
        : `${roleName(role.roleId)} on ${projectName(role.projectId)}`;
    return { roleName, projectName, describe };
  }, [roles, projects]);
}
