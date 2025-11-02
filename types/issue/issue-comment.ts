// types/issue/issue-comment.ts

/**
 * IssueComment – shape only
 */
export interface IssueComment {
  id?: number;
  comment: string;
  author: string;
  createdAt: Date;
}

/** -------------------------------------------------------------
 *  JSON → IssueComment
 *  ------------------------------------------------------------- */
export function parseIssueComment(json: any): IssueComment {
  return {
    id: json.id ?? undefined,
    comment: json.comment ?? '',
    author: json.author ?? '',
    createdAt: new Date(json.createdAt), // assumes ISO string
  };
}

/** -------------------------------------------------------------
 *  IssueComment → JSON
 *  ------------------------------------------------------------- */
export function issueCommentToJson(comment: IssueComment): Record<string, any> {
  return {
    id: comment.id,
    comment: comment.comment,
    author: comment.author,
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
    a.author === b.author &&
    a.createdAt.getTime() === b.createdAt.getTime()
  );
}