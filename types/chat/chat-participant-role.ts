// types/chat/chat-participant-role.ts

export enum ChatParticipantRole {
  admin = 'admin',
  member = 'member',
}

export function getChatParticipantRoleLabel(role: ChatParticipantRole): string {
  const map: Record<ChatParticipantRole, string> = {
    [ChatParticipantRole.admin]: 'Admin',
    [ChatParticipantRole.member]: 'Member',
  };
  return map[role];
}

export function chatParticipantRoleFromString(
  str: string
): ChatParticipantRole {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (ChatParticipantRole as any)[str];
  if (!role) return ChatParticipantRole.member;
  return role;
}
