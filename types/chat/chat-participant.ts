// types/chat/chat-participant.ts

import { Employee } from '@/types/employee/employee';
import {
  ChatParticipantRole,
  chatParticipantRoleFromString,
} from './chat-participant-role';

export interface ChatParticipant {
  employeeId: number;
  employee?: Employee; // resolved at hook level
  role: ChatParticipantRole;
  joinedAt: Date;
  lastReadAt?: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseChatParticipant(json: any): ChatParticipant {
  return {
    employeeId: json.employeeId ?? json.employee_id ?? 0,
    role: chatParticipantRoleFromString(json.role ?? 'member'),
    joinedAt: json.joinedAt ? new Date(json.joinedAt) : new Date(),
    lastReadAt: json.lastReadAt ? new Date(json.lastReadAt) : undefined,
  };
}
