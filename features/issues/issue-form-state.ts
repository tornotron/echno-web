/**
 * features/issues/issue-form-state.ts
 *
 * The shape the issue form holds while it is being filled in.
 *
 * Kept apart from the component so the payload builders can read it without
 * pulling a client component into a plain module.
 */

import type {
  IssuePriority,
  IssueStatus,
  IssueType,
} from '@tornotron/echno-core/issue/types';

/**
 * What the priority control can hold. The empty string is "none picked", which
 * is a state a saved issue can genuinely be in: the backend column is nullable
 * with no default, so an issue raised before the column existed has no
 * priority, and seeding the control with one would put a value on screen
 * nobody chose.
 */
export type IssueFormPriority = IssuePriority | '';

export interface IssueFormState {
  initialized: boolean;
  /**
   * The answer to "is this about a particular task?". When yes, a task has to
   * be picked; when no, the issue belongs to the project the form was opened
   * under, and the task is not sent (ClickUp 14zdkkvzx60).
   */
  relatedToTask: boolean;
  taskId: string;
  /**
   * The issue's domain: the id of the work category it concerns, or empty for
   * none. On an issue raised on a task, none means the task's own category.
   */
  categoryId: string;
  title: string;
  description: string;
  issueType: IssueType;
  status: IssueStatus;
  priority: IssueFormPriority;
  assigneeId: string;
}

export interface IssueFormSubmitData {
  fields: IssueFormState;
  attachments: File[];
}
