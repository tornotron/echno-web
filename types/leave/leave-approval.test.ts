import { describe, expect, test } from 'bun:test';
import { approvalActionToJson } from './leave-approval';

/**
 * A leave decision used to name its approver in the request body. The backend
 * reads the approver from the signed-in session now (echno-backend #598) and
 * `LeaveApprovalActionDto` no longer declares the field, so a client that keeps
 * sending it is stating an authorship the server does not read.
 *
 * The value was always the signed-in employee's own id, so nothing was wrong
 * with what went out. The reason to close it is what the shape allowed: a body
 * with a slot for the approver is a body somebody can put a colleague's id
 * into. Spring answers 200 either way, so only a test notices.
 */
describe('approvalActionToJson', () => {
  test('a decision does not name its approver', () => {
    const json = approvalActionToJson({ comments: 'Cover arranged.' });

    expect(json).not.toHaveProperty('approverId');
    expect(json.comments).toBe('Cover arranged.');
  });

  // A delegation still names the delegate. That is an instruction about where
  // the request goes next, not a claim about who acted.
  test('a delegation still names where the request goes next', () => {
    const json = approvalActionToJson({
      comments: 'On site all week.',
      delegateToId: 9,
    });

    expect(json).not.toHaveProperty('approverId');
    expect(json.delegateToId).toBe(9);
  });

  test('with nothing to say the body is empty, not an id', () => {
    expect(Object.keys(approvalActionToJson({}))).toEqual([]);
  });
});
