// types/issue/issue-comment.ts

import { Member, memberToJson, parseMember } from '@/types/member';

/**
 * IssueComment – shape only
 */
export interface IssueComment {
  id?: number;
  comment: string;
  author?: Member;
  createdAt: Date;
}

/** -------------------------------------------------------------
 *  JSON → IssueComment
 *  ------------------------------------------------------------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseIssueComment(json: any): IssueComment {
  return {
    id: json.id ?? undefined,
    comment: json.comment ?? '',
    author: json.author ? parseMember(json.author) : undefined,
    createdAt: new Date(json.createdAt), // assumes ISO string
  };
}

/** -------------------------------------------------------------
 *  IssueComment → JSON
 *  ------------------------------------------------------------- */
export function issueCommentToJson(
  comment: IssueComment
): Record<string, unknown> {
  return {
    id: comment.id,
    comment: comment.comment,
    author: comment.author ? memberToJson(comment.author) : undefined,
    createdAt: comment.createdAt.toISOString(),
  };
}

/** -------------------------------------------------------------
 *  Equality check (like Equatable.props)
 *  Useful for React memo, useMemo, etc.
 *  ------------------------------------------------------------- */
export function areIssueCommentsEqual(
  a: IssueComment,
  b: IssueComment
): boolean {
  if (a === b) return true;
  return (
    a.id === b.id &&
    a.comment === b.comment &&
    a.author?.id === b.author?.id &&
    a.createdAt.getTime() === b.createdAt.getTime()
  );
}
