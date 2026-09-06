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
  taskId: string;
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
