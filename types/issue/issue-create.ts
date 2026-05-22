// TODO: Phase 8 — implement createIssueToJson and replace Partial<Issue> in issue-service
import { IssueType } from './issue-type';
import { IssueStatus } from './issue-status';

export interface CreateIssueRequest {
  title: string;
  description?: string;
  issueType: IssueType;
  status?: IssueStatus;
  priority?: string;
  projectId: number;
  creatorId: number;
  assigneeId?: number;
  dueDate?: Date;
}
