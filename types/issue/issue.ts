// types/issue/issue.ts
import { IssueType, issueTypeFromString } from './issue-type';
import { IssueStatus, issueStatusFromString } from './issue-status';
import { IssueComment } from './issue-comment';
import { Attachment } from '@/types/attachment';
import { Member, memberToJson, parseMember } from '@/types/member';

export interface Issue {
  id?: number;
  taskId?: number; // Link to parent task
  title: string;
  description?: string;
  type: IssueType;
  status: IssueStatus;
  createdAt: Date;
  updatedAt?: Date;
  creator?: Member;
  comments?: IssueComment[];
  attachments?: Attachment[];
}

/** JSON → Issue */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseIssue(json: any): Issue {
  return {
    id: json.id ?? undefined,
    taskId: json.taskId ?? undefined,
    title: json.title ?? '',
    description: json.description ?? undefined,
    type: issueTypeFromString(json.type),
    status: issueStatusFromString(json.status),
    createdAt: new Date(json.createdAt),
    updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined,
    creator: json.creator ? parseMember(json.creator) : undefined,
    comments: json.comments
      ? (json.comments as unknown[]).map((c) => parseIssueComment(c))
      : [],
  };
}

import { parseIssueComment } from './issue-comment'; // for nested parsing

/** Issue → JSON */
export function issueToJson(issue: Issue): Record<string, unknown> {
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt?.toISOString(),
    creator: issue.creator ? memberToJson(issue.creator) : undefined,
    // comments are not sent on update
  };
}

/** copyWith – immutable update */
export function copyIssue(
  issue: Issue,
  updates: Partial<
    Pick<Issue, 'title' | 'description' | 'type' | 'status' | 'creator'>
  >
): Issue {
  return {
    ...issue,
    ...updates,
  };
}

/** Equality (like Equatable) */
export function areIssuesEqual(a: Issue, b: Issue): boolean {
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.description === b.description &&
    a.type === b.type &&
    a.status === b.status &&
    a.createdAt.getTime() === b.createdAt.getTime() &&
    a.updatedAt?.getTime() === b.updatedAt?.getTime() &&
    a.creator?.id === b.creator?.id
  );
}
