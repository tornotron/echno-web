import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

/**
 * Four screens used to name who was acting in the payload they sent: an issue's
 * creator, a comment's author, a task's creator and a leave approver. The
 * backend stamps all four from the signed-in session now (echno-backend #598 /
 * PR #607) and `docs/openapi.json` no longer declares them.
 *
 * Every value these screens sent was the signed-in employee's own id, so
 * nothing was wrong with what went out. What the shape allowed is the reason to
 * close it: a payload with a slot for "who did this" is a payload somebody can
 * put a colleague's id into, and only the server can tell the two apart. Spring
 * discards a property it does not recognise and answers 200, so a screen that
 * quietly starts sending one again produces no error anywhere. This is the only
 * thing that would notice.
 *
 * Each entry names the file and the assignment that must not come back. The
 * paths are load-bearing: if a screen moves, this test errors on the read
 * rather than passing on an empty search.
 */
const FORBIDDEN: { file: string; what: string; fragments: string[] }[] = [
  {
    file: 'features/issues/components/issue-comments-tab.tsx',
    what: 'the comment composer names its author',
    fragments: ['authorId'],
  },
  {
    file: 'app/users/dashboard/projects/all-projects/[id]/issues/new/page.tsx',
    what: 'the issue create form names its creator',
    fragments: ['creatorId', 'createdById'],
  },
  {
    file: 'app/users/dashboard/projects/all-projects/[id]/tasks/new/page.tsx',
    what: 'the task create form names its creator',
    fragments: ['creatorId'],
  },
  {
    file: 'app/users/dashboard/projects/all-projects/[id]/tasks/[taskId]/edit/page.tsx',
    what: 'the task edit form rewrites the creator',
    fragments: ['creatorId'],
  },
];

describe('payloads no longer name who is acting', () => {
  for (const { file, what, fragments } of FORBIDDEN) {
    test(what, () => {
      const source = readFileSync(file, 'utf8');
      const found = fragments.filter((fragment) => source.includes(fragment));
      expect(found).toEqual([]);
    });
  }
});

/**
 * The comment composer waited on the employee query before it would post,
 * because it needed an id for the payload. It does not need one now, and the
 * wait was the only thing that guard did: `currentEmployee` still feeds the
 * avatar beside the box. Holding the button shut until an unrelated query
 * resolves delays a comment that would have worked.
 */
describe('the comment composer does not wait on the employee query', () => {
  test('neither the handler nor the button gates on an employee id', () => {
    const source = readFileSync(
      'features/issues/components/issue-comments-tab.tsx',
      'utf8'
    );
    expect(source.includes('!currentEmployee?.id')).toBe(false);
  });
});

/**
 * The three leave decisions take the acting approver as their own mutation
 * variable rather than inside the payload. It is not sent: the hook needs it
 * because the pending-approvals cache is keyed by approver, and reading it off
 * the payload was the only reason the payload carried it.
 */
describe('a leave decision keeps the approver out of the body', () => {
  const screen =
    'app/users/dashboard/workforce/leaves/manage/requests/[id]/page.tsx';

  test('the approver sits beside the payload, not in it', () => {
    const source = readFileSync(screen, 'utf8');

    // Three decisions: approve, reject, delegate.
    const occurrences = source.split('approverId: employeeId').length - 1;
    expect(occurrences).toBe(3);

    // Each one is a sibling of `dto:`, never a member of it. A member would be
    // indented four spaces deeper than the `dto: {` that opened the block.
    expect(source.includes('dto: {\n          approverId')).toBe(false);
  });

  test('the serializer that builds the body drops it either way', () => {
    const source = readFileSync('types/leave/leave-approval.ts', 'utf8');
    expect(source.includes('approverId: dto.approverId')).toBe(false);
  });
});
