// types/chat/chat-room-type.ts

export enum ChatRoomType {
  group = 'group',
  direct = 'direct',
  ai = 'ai',
}

export function getChatRoomTypeLabel(type: ChatRoomType): string {
  const map: Record<ChatRoomType, string> = {
    [ChatRoomType.group]: 'Project Group',
    [ChatRoomType.direct]: 'Direct Message',
    [ChatRoomType.ai]: 'AI Assistant',
  };
  return map[type];
}

export function getChatRoomTypeIcon(type: ChatRoomType): string {
  const map: Record<ChatRoomType, string> = {
    [ChatRoomType.group]: 'folder',
    [ChatRoomType.direct]: 'user',
    [ChatRoomType.ai]: 'bot',
  };
  return map[type];
}

export function getChatRoomTypeColor(type: ChatRoomType): string {
  const map: Record<ChatRoomType, string> = {
    [ChatRoomType.group]: '#3B82F6',
    [ChatRoomType.direct]: '#10B981',
    [ChatRoomType.ai]: '#8B5CF6',
  };
  return map[type];
}

export function chatRoomTypeFromString(str: string): ChatRoomType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const type = (ChatRoomType as any)[str];
  if (!type) return ChatRoomType.direct;
  return type;
}
