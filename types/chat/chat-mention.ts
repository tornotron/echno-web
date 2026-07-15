import type { ChatParticipant } from './chat-participant';
import type { Task } from '@tornotron/echno-core/task/types';
import type { Issue } from '@tornotron/echno-core/issue/types';

export type MentionMode = 'member' | 'task' | 'issue';

export interface MentionMember {
  kind: 'member';
  employeeId: number;
  name: string;
  avatar?: string;
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

export type MentionItem = MentionMember | MentionTask | MentionIssue;

export interface UseMentionOptions {
  participants: ChatParticipant[];
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
