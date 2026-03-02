// types/chat/chat-entity-type.ts

export enum ChatEntityType {
  task = 'task',
  issue = 'issue',
  project = 'project',
}

export function getChatEntityTypeLabel(type: ChatEntityType): string {
  const map: Record<ChatEntityType, string> = {
    [ChatEntityType.task]: 'Task',
    [ChatEntityType.issue]: 'Issue',
    [ChatEntityType.project]: 'Project',
  };
  return map[type];
}

export function getChatEntityTypeIcon(type: ChatEntityType): string {
  const map: Record<ChatEntityType, string> = {
    [ChatEntityType.task]: 'check-square',
    [ChatEntityType.issue]: 'alert-circle',
    [ChatEntityType.project]: 'folder',
  };
  return map[type];
}

export function chatEntityTypeFromString(str: string): ChatEntityType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const type = (ChatEntityType as any)[str];
  if (!type) return ChatEntityType.task;
  return type;
}
