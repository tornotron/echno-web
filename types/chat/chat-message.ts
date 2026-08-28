// types/chat/chat-message.ts

import { ChatPerson } from './chat-person';
import { parsePositiveInt } from '@/types/parse-id';
import {
  Attachment,
  parseAttachment,
} from '@tornotron/echno-core/attachment/types';
import { ChatReaction, parseChatReaction } from './chat-reaction';
import {
  ChatEntityMention,
  parseChatEntityMention,
} from './chat-entity-mention';

export interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  sender?: ChatPerson; // resolved at hook level
  content: string; // @[Name](id) for mentions, #[label](type:id) for entity mentions
  replyToId?: number;
  replyTo?: Pick<ChatMessage, 'id' | 'senderId' | 'content' | 'sender'>; // resolved preview
  mentions: number[]; // employee IDs for notification badges
  entityMentions: ChatEntityMention[];
  reactions: ChatReaction[];
  attachments?: Attachment[];
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function parseReplyTo(
  raw: unknown
): Pick<ChatMessage, 'id' | 'senderId' | 'content' | 'sender'> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  return {
    id: (r.id as number) ?? 0,
    senderId: (r.senderId as number) ?? (r.sender_id as number) ?? 0,
    content: (r.content as string) ?? '',
    sender: r.sender as ChatMessage['sender'],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseChatMessage(json: any): ChatMessage {
  return {
    id: parsePositiveInt(json.id, 'parseChatMessage.id'),
    roomId: json.roomId ?? json.room_id ?? 0,
    senderId: json.senderId ?? json.sender_id ?? 0,
    content: json.content ?? '',
    replyToId: json.replyToId ?? json.reply_to_id ?? undefined,
    replyTo: parseReplyTo(json.replyTo ?? json.reply_to),
    mentions: Array.isArray(json.mentions) ? json.mentions : [],
    entityMentions: Array.isArray(json.entityMentions)
      ? json.entityMentions.map((m: unknown) => parseChatEntityMention(m))
      : [],
    reactions: Array.isArray(json.reactions)
      ? json.reactions.map((r: unknown) => parseChatReaction(r))
      : [],
    attachments: Array.isArray(json.attachments)
      ? json.attachments.map((a: unknown) => parseAttachment(a))
      : undefined,
    isEdited: json.isEdited ?? false,
    editedAt: json.editedAt ? new Date(json.editedAt) : undefined,
    isDeleted: json.isDeleted ?? false,
    createdAt: json.createdAt ? new Date(json.createdAt) : new Date(),
    updatedAt: json.updatedAt ? new Date(json.updatedAt) : new Date(),
  };
}

// ─── WebSocket Event Types ─────────────────────────────────────────────────
// Defined here for future WebSocket integration. Currently unused until
// WebSocket transport is wired up.

export type ChatSocketEvent =
  | { type: 'message.new'; payload: ChatMessage }
  | { type: 'message.edited'; payload: ChatMessage }
  | { type: 'message.deleted'; payload: { id: number; roomId: number } }
  | {
      type: 'reaction.toggled';
      payload: { messageId: number; emoji: string; employeeId: number };
    }
  | { type: 'typing.start'; payload: { roomId: number; employeeId: number } }
  | { type: 'typing.stop'; payload: { roomId: number; employeeId: number } };
