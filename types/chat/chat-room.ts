// types/chat/chat-room.ts

import { Project } from '@tornotron/echno-core/project/types';
import { parsePositiveInt } from '@/types/parse-id';
import { ChatRoomType, chatRoomTypeFromString } from './chat-room-type';
import { ChatParticipant, parseChatParticipant } from './chat-participant';
import { ChatMessage, parseChatMessage } from './chat-message';

export interface ChatRoom {
  id: number;
  type: ChatRoomType;
  name?: string; // group: project name; direct: derived from other participant
  description?: string;
  projectId?: number; // group rooms only
  project?: Project; // resolved at hook level
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseChatRoom(json: any): ChatRoom {
  return {
    id: parsePositiveInt(json.id, 'parseChatRoom.id'),
    type: chatRoomTypeFromString(json.type ?? 'direct'),
    name: json.name ?? undefined,
    description: json.description ?? undefined,
    projectId: json.projectId ?? json.project_id ?? undefined,
    participants: Array.isArray(json.participants)
      ? json.participants.map((p: unknown) => parseChatParticipant(p))
      : [],
    lastMessage: json.lastMessage
      ? parseChatMessage(json.lastMessage)
      : undefined,
    unreadCount: json.unreadCount ?? 0,
    isArchived: json.isArchived ?? false,
    createdAt: json.createdAt ? new Date(json.createdAt) : new Date(),
    updatedAt: json.updatedAt ? new Date(json.updatedAt) : new Date(),
  };
}
