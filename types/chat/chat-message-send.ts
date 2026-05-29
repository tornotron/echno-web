import type { ChatEntityType } from './chat-entity-type';

export interface SendMessageData {
  content: string;
  replyToId?: number;
  mentions?: number[];
  entityMentions?: { entityType: ChatEntityType; entityId: number }[];
  attachments?: File[];
}
