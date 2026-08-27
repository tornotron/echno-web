// hooks/chat/use-chat-stream.ts

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ChatStreamEvent,
  ChatStreamEventType,
  parseChatStreamEvent,
} from '@/types/chat';
import { logger } from '@/lib/logger';

/** Where the BFF proxies the backend's server-sent event stream. */
const STREAM_URL = '/api/v1/chat/stream';

/**
 * Opens the chat event stream and turns each frame into a cache invalidation.
 *
 * Exactly one of these should exist per browser tab, which is why it is consumed through
 * `ChatStreamProvider` rather than called from each component that shows chat: the chat page
 * and the dashboard-wide floating chat are both mounted in many places, and a hook per
 * consumer would open a connection per consumer.
 *
 * Frames carry no content, so nothing here writes to the cache directly. Invalidating and
 * letting the existing queries refetch keeps one code path for reading chat, and it means a
 * frame can never put data on screen that the ordinary authorized endpoint would not return.
 */
export function useChatStream() {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  // Held in a ref, not state: the effect below must not re-run when it changes.
  const hasConnectedBefore = useRef(false);

  const invalidateRoom = useCallback(
    (roomId: number) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
    [queryClient]
  );

  const invalidateEverything = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
    queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
  }, [queryClient]);

  const applyEvent = useCallback(
    (event: ChatStreamEvent) => {
      switch (event.type) {
        case ChatStreamEventType.messageCreated:
        case ChatStreamEventType.messageUpdated: {
          invalidateRoom(event.roomId);
          break;
        }
        case ChatStreamEventType.roomUpdated: {
          // No message query to touch, but the room's ordering, last message and unread
          // count all live in the room queries.
          queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
          break;
        }
      }
    },
    [invalidateRoom, queryClient]
  );

  useEffect(() => {
    const source = new EventSource(STREAM_URL);

    // EventSource's own open event, which fires on every successful connection including a
    // reconnect. The server's opening frame is named "ready" precisely so it cannot be
    // confused with this one.
    source.addEventListener('open', () => {
      setConnected(true);
      if (hasConnectedBefore.current) {
        // A reconnect, not the first connection. Anything that happened while the stream was
        // down was never delivered (the server keeps no history and Redis pub/sub holds
        // nothing for an absent subscriber), so the whole of chat is refetched rather than
        // trusting a cache that may have missed a change.
        invalidateEverything();
      }
      hasConnectedBefore.current = true;
    });

    source.addEventListener('chat', (event) => {
      try {
        const parsed = parseChatStreamEvent(
          JSON.parse((event as MessageEvent).data)
        );
        if (parsed) applyEvent(parsed);
      } catch (error) {
        logger.warn('Discarding an unreadable chat stream frame', { error });
      }
    });

    source.addEventListener('error', () => {
      // EventSource reconnects on its own, using the retry interval the server sent on the
      // opening frame. Reporting disconnection is what puts the polling fallback back on its
      // faster cadence in the meantime.
      setConnected(false);
    });

    return () => {
      source.close();
      setConnected(false);
    };
  }, [applyEvent, invalidateEverything]);

  return { connected };
}
