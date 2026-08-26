import { describe, expect, test } from 'bun:test';
import { ChatStreamEventType, parseChatStreamEvent } from './chat-stream-event';

// Frames arrive as untyped JSON off a network stream, so parsing is the boundary where a
// malformed or unexpected frame has to be discarded rather than acted on.
describe('parseChatStreamEvent', () => {
  test('reads a well-formed message frame', () => {
    const event = parseChatStreamEvent({
      type: 'MESSAGE_CREATED',
      roomId: 5,
      messageId: 99,
      actorEmployeeId: 10,
    });

    expect(event).toEqual({
      type: ChatStreamEventType.messageCreated,
      roomId: 5,
      messageId: 99,
      actorEmployeeId: 10,
    });
  });

  test('reads a room frame that carries no message id', () => {
    const event = parseChatStreamEvent({
      type: 'ROOM_UPDATED',
      roomId: 5,
      messageId: null,
      actorEmployeeId: 10,
    });

    expect(event?.type).toBe(ChatStreamEventType.roomUpdated);
    expect(event?.messageId).toBeUndefined();
  });

  test('discards an unknown event type', () => {
    // A newer backend sending a type this client does not handle must be ignored, not
    // turned into an invalidation of something arbitrary.
    expect(
      parseChatStreamEvent({ type: 'MESSAGE_PINNED', roomId: 5 })
    ).toBeUndefined();
  });

  test('discards a frame with no usable room id', () => {
    expect(
      parseChatStreamEvent({ type: 'MESSAGE_CREATED', roomId: '5' })
    ).toBeUndefined();
    expect(parseChatStreamEvent({ type: 'MESSAGE_CREATED' })).toBeUndefined();
  });

  test('discards anything that is not an object', () => {
    expect(parseChatStreamEvent(null)).toBeUndefined();
    expect(parseChatStreamEvent('MESSAGE_CREATED')).toBeUndefined();
    expect(parseChatStreamEvent(undefined)).toBeUndefined();
  });
});
