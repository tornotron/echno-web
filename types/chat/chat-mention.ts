import type { ChatParticipant } from './chat-participant';
import type { Task } from '@tornotron/echno-core/task/types';
import type { Issue } from '@tornotron/echno-core/issue/types';
import type { Project } from '@tornotron/echno-core/project/types';

export type MentionMode = 'all' | 'project' | 'task' | 'issue';

export interface MentionMember {
  kind: 'member';
  employeeId: number;
  name: string;
  avatar?: string;
}

export interface MentionProject {
  kind: 'project';
  id: number;
  name: string;
}

export interface MentionTask {
  kind: 'task';
  id: number;
  title: string;
}

export interface MentionIssue {
  kind: 'issue';
  id: number;
  title: string;
}

export type MentionItem =
  | MentionMember
  | MentionProject
  | MentionTask
  | MentionIssue;

export interface UseMentionOptions {
  participants: ChatParticipant[];
  projects: Project[];
  tasks: Task[];
  issues: Issue[];
}

export interface UseMentionReturn {
  open: boolean;
  mode: MentionMode;
  items: MentionItem[];
  activeIndex: number;
  onValueChange: (value: string, cursorPos: number) => void;
  selectItem: (index?: number) => void;
  moveUp: () => void;
  moveDown: () => void;
  dismiss: () => void;
  query: string;
}
