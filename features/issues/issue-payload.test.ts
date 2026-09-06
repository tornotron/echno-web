/**
 * features/issues/issue-payload.test.ts
 *
 * What the issue form collects has to reach the wire. The regression these
 * guard against is #400: the priority control has existed for as long as the
 * form has, and neither page put the value in its payload, so a user picked
 * one, watched the form respond to it, saved, and found nothing recorded.
 *
 * The assertions are on the serialized body rather than on the request object,
 * because that is where a dropped field actually shows: the request interface
 * carries fields the serializer deliberately leaves out, and `projectId` is one
 * of them.
 */
import { describe, expect, test } from 'bun:test';
import {
  IssuePriority,
  IssueStatus,
  IssueType,
  createIssueToJson,
  updateIssueToJson,
} from '@tornotron/echno-core/issue/types';
import type { IssueFormState } from './issue-form-state';
import {
  buildCreateIssuePayload,
  buildUpdateIssuePayload,
} from './issue-payload';

/** The form as it stands when somebody has filled it in and pressed save. */
function filledForm(overrides: Partial<IssueFormState> = {}): IssueFormState {
  return {
    initialized: true,
    taskId: '11',
    title: 'Honeycombing on the raft',
    description: 'Voids along the north face of the raft pour.',
    issueType: IssueType.technical,
    status: IssueStatus.open,
    priority: IssuePriority.critical,
    assigneeId: '5',
    ...overrides,
  };
}

describe('the create payload', () => {
  test('carries the priority the form collected', () => {
    const body = createIssueToJson(buildCreateIssuePayload(filledForm(), '3'));

    expect(body.priority).toBe(IssuePriority.critical);
  });

  test('leaves the priority out when none was picked', () => {
    // Not `null`, and not the form's own default. An absent key is an issue
    // raised without a priority, which the nullable column allows.
    const body = createIssueToJson(
      buildCreateIssuePayload(filledForm({ priority: '' }), '3')
    );

    expect('priority' in body).toBe(false);
  });

  test('still carries every other field the form collects', () => {
    // A guard on the fields that were already reaching the wire, so collapsing
    // the two pages onto one builder cannot quietly drop one of them.
    const body = createIssueToJson(buildCreateIssuePayload(filledForm(), '3'));

    expect(body.title).toBe('Honeycombing on the raft');
    expect(body.description).toBe(
      'Voids along the north face of the raft pour.'
    );
    expect(body.type).toBe(IssueType.technical);
    expect(body.status).toBe(IssueStatus.open);
    expect(body.taskId).toBe(11);
    expect(body.assignedToId).toBe(5);
  });

  test('routes on the project without sending it', () => {
    // The backend walks the parent task to the project. The request object
    // carries the id so the mutation can file the new issue under the right
    // cached list, and the serializer drops it.
    const request = buildCreateIssuePayload(filledForm(), '3');

    expect(request.projectId).toBe(3);
    expect('projectId' in createIssueToJson(request)).toBe(false);
  });
});

describe('the update payload', () => {
  test('carries the priority the form collected', () => {
    const body = updateIssueToJson(buildUpdateIssuePayload(filledForm()));

    expect(body.priority).toBe(IssuePriority.critical);
  });

  test('leaves the priority out when the control is blank', () => {
    // A blank control on the edit form is an issue that never had a priority.
    // An explicit null would clear it, which is a different statement and one
    // the form has no control for, so the key is omitted and the stored value
    // is left as it was.
    const body = updateIssueToJson(
      buildUpdateIssuePayload(filledForm({ priority: '' }))
    );

    expect('priority' in body).toBe(false);
    expect(body.priority).toBeUndefined();
  });

  test('still carries every other field the form collects', () => {
    const body = updateIssueToJson(buildUpdateIssuePayload(filledForm()));

    expect(body.title).toBe('Honeycombing on the raft');
    expect(body.description).toBe(
      'Voids along the north face of the raft pour.'
    );
    expect(body.type).toBe(IssueType.technical);
    expect(body.status).toBe(IssueStatus.open);
    expect(body.assignedToId).toBe(5);
  });
});
