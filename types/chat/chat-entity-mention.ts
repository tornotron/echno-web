// types/chat/chat-entity-mention.ts

import { ChatEntityType, chatEntityTypeFromString } from './chat-entity-type';
import { parsePositiveInt } from '@/types/parse-id';

export interface ChatEntityMention {
  entityType: ChatEntityType;
  entityId: number;
  label?: string; // display label cached at time of mention
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseChatEntityMention(json: any): ChatEntityMention {
  return {
    entityType: chatEntityTypeFromString(json.entityType ?? 'task'),
    entityId: parsePositiveInt(
      json.entityId,
      'parseChatEntityMention.entityId'
    ),
    label: json.label ?? undefined,
  };
}
