/**
 * features/issues/issue-payload.ts
 *
 * Turns the issue form's fields into the request bodies the create and update
 * endpoints take.
 *
 * Both pages used to assemble their own object literal, and both left
 * `priority` out of it, so a user could pick one, watch the form respond to
 * it, save, and find nothing had been recorded (#400). A field the form
 * collects reaching the wire is now one function's job rather than a thing to
 * remember in two places, and it has a test.
 */

import type {
  CreateIssueRequest,
  UpdateIssueRequest,
} from '@tornotron/echno-core/issue/types';
import type { IssueFormState } from './issue-form-state';

/**
 * Builds the create body from the form's fields.
 *
 * `projectId` comes from the route rather than the form. It is not sent: the
 * backend walks the parent task to the project, and the core request type
 * carries the field only so the mutation can file the new issue under the
 * right project's cached list.
 *
 * @param fields - The form state at submit time.
 * @param projectId - The project the form was opened under, as a route param.
 * @returns The create request body.
 */
export function buildCreateIssuePayload(
  fields: IssueFormState,
  projectId: string
): CreateIssueRequest {
  return {
    title: fields.title,
    description: fields.description,
    issueType: fields.issueType,
    status: fields.status,
    priority: fields.priority || undefined,
    projectId: Number.parseInt(projectId),
    taskId: fields.taskId ? Number(fields.taskId) : undefined,
    assigneeId: fields.assigneeId ? Number(fields.assigneeId) : undefined,
  };
}

/**
 * Builds the partial-update body from the form's fields.
 *
 * An unpicked priority is left out rather than sent as `null`. The endpoint
 * reads an explicit null as "clear it", and the form has no control that means
 * that: a blank control on the edit form is an issue that never had one, so
 * omitting the key leaves it as it was.
 *
 * @param fields - The form state at submit time.
 * @returns The update request body.
 */
export function buildUpdateIssuePayload(
  fields: IssueFormState
): UpdateIssueRequest {
  return {
    title: fields.title,
    description: fields.description,
    issueType: fields.issueType,
    status: fields.status,
    priority: fields.priority || undefined,
    assigneeId: fields.assigneeId ? Number(fields.assigneeId) : undefined,
  };
}
