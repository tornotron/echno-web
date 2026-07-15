// types/chat/chat-reaction.ts

import { Employee } from '@tornotron/echno-core/employee/types';

export interface ChatReaction {
  emoji: string;
  count: number;
  employeeIds: number[];
  employees?: Employee[]; // resolved at hook level
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseChatReaction(json: any): ChatReaction {
  return {
    emoji: json.emoji ?? '',
    count: json.count ?? json.employeeIds?.length ?? 0,
    employeeIds: Array.isArray(json.employeeIds) ? json.employeeIds : [],
  };
}
