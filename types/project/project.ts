// types/project/project.ts
import { Member, parseMember, memberToJson } from '@/types/member';
import { Task, parseTask } from '@/types/task';
import { ProjectStatus, getProjectStatus } from './project-status';
import type { Attachment } from '../attachment';
import { parseAttachment, attachmentToJson } from '../attachment/attachment';

export interface Project {
  id: number;
  projectName: string;
  projectAddress: string;
  status: ProjectStatus;
  projectLongitude: number;
  projectLatitude: number;
  organizationId?: number;
  startDate?: Date;
  endDate?: Date;
  createdAt?: Date;
  members: Member[];
  tasks: Task[];
  attachments?: Attachment[];
}

/** Add member (immutable) */
export function addMember(project: Project, member: Member): Project {
  if (project.members.some((m) => m.id === member.id)) {
    return project;
  }
  return {
    ...project,
    members: [...project.members, member],
  };
}

/** Remove member (immutable) */
export function removeMember(project: Project, member: Member): Project {
  return {
    ...project,
    members: project.members.filter((m) => m.id !== member.id),
  };
}

/** JSON → Project */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseProject(json: any): Project {
  return {
    id: json.id ?? 0,
    projectName: json.projectName ?? '',
    projectAddress: json.projectAddress ?? '',
    status: getProjectStatus(json.status) ?? ProjectStatus.upcoming,
    organizationId: json.organizationId
      ? Number(json.organizationId)
      : undefined,
    projectLongitude: Number(json.projectLongitude ?? 0),
    projectLatitude: Number(json.projectLatitude ?? 0),
    startDate: json.startDate ? new Date(json.startDate) : undefined,
    endDate: json.endDate ? new Date(json.endDate) : undefined,
    createdAt: json.createdAt ? new Date(json.createdAt) : undefined,
    members: json.teamMembers
      ? (json.teamMembers as unknown[]).map((m) => parseMember(m))
      : [],
    tasks: json.tasks ? (json.tasks as unknown[]).map((t) => parseTask(t)) : [],
    attachments: json.attachments
      ? (json.attachments as unknown[]).map((a) => parseAttachment(a))
      : undefined,
  };
}

/** Project → JSON */
export function projectToJson(project: Project): Record<string, unknown> {
  return {
    id: project.id,
    organizationId: project.organizationId,
    projectName: project.projectName,
    projectAddress: project.projectAddress,
    status: project.status,
    projectLongitude: project.projectLongitude,
    projectLatitude: project.projectLatitude,
    startDate: project.startDate?.toISOString(),
    endDate: project.endDate?.toISOString(),
    teamMembers: project.members.map((m) => memberToJson(m)),
    createdAt: project.createdAt?.toISOString(),
    attachments: project.attachments
      ? project.attachments.map((a) => attachmentToJson(a))
      : undefined,
    // tasks are not sent in update
  };
}
