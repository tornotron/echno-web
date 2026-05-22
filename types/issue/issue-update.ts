// TODO: Phase 8 — implement updateIssueToJson and replace Partial<Issue> in issue-service
import { IssueType } from './issue-type';
import { IssueStatus } from './issue-status';

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  issueType?: IssueType;
  status?: IssueStatus;
  priority?: string;
  assigneeId?: number;
  dueDate?: Date;
}
