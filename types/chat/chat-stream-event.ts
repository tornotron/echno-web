// types/chat/chat-stream-event.ts

/**
 * The kinds of change the backend pushes down the chat stream.
 *
 * Deliberately coarse, and matching the backend enum of the same name.
 * `messageUpdated` covers an edit, a delete and a reaction alike, because the client's
 * response to all three is the same: invalidate the room's messages and refetch.
 */
export enum ChatStreamEventType {
  messageCreated = 'MESSAGE_CREATED',
  messageUpdated = 'MESSAGE_UPDATED',
  roomUpdated = 'ROOM_UPDATED',
}

/**
 * One frame off the chat stream.
 *
 * It carries identifiers only, never message content. The server cannot render a payload
 * that is correct for every recipient (unread counts differ per viewer, attachment URLs are
 * signed per request), and a rendered payload on this path would sit outside the
 * authorization the REST endpoints apply. So a frame is a prompt to refetch, and the refetch
 * is what decides what this user may see.
 */
export interface ChatStreamEvent {
  type: ChatStreamEventType;
  roomId: number;
  /** Absent on room-level events. */
  messageId?: number;
  actorEmployeeId: number;
}

/** Narrows an unknown parsed frame to a usable event, discarding anything malformed. */
export function parseChatStreamEvent(
  raw: unknown
): ChatStreamEvent | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;

  const candidate = raw as Record<string, unknown>;
  const type = candidate.type;
  const roomId = candidate.roomId;

  const isKnownType = Object.values(ChatStreamEventType).includes(
    type as ChatStreamEventType
  );
  if (!isKnownType || typeof roomId !== 'number') return undefined;

  return {
    type: type as ChatStreamEventType,
    roomId,
    messageId:
      typeof candidate.messageId === 'number' ? candidate.messageId : undefined,
    actorEmployeeId:
      typeof candidate.actorEmployeeId === 'number'
        ? candidate.actorEmployeeId
        : 0,
  };
}
