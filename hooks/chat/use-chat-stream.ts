// hooks/chat/use-chat-stream.ts

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ChatStreamEvent,
  ChatStreamEventType,
  parseChatStreamEvent,
} from '@/types/chat';
import { refreshSessionOnce } from '@/lib/auth/refresh-session-once';
import { logger } from '@/lib/logger';

/** Where the BFF proxies the backend's server-sent event stream. */
const STREAM_URL = '/api/v1/chat/stream';

/**
 * `EventSource.CLOSED`, spelled out.
 *
 * The constant lives on the constructor, and the constructor here is whatever
 * the environment provides, so reading it off the global couples this module to
 * a browser built-in that a test replaces. The value is fixed by the HTML spec.
 */
const EVENT_SOURCE_CLOSED = 2;

/**
 * Backoff for reopening a stream the browser gave up on.
 *
 * The first delay matches the `retry: 1000` the server sends on its opening
 * frame, so the ordinary case (an expired access token met at the ten minute
 * recycle) recovers on roughly the cadence the browser would have used itself.
 * From there it doubles up to the ceiling.
 */
const REOPEN_BASE_DELAY_MS = 1000;
const REOPEN_MAX_DELAY_MS = 30_000;

/**
 * How many times to reopen before leaving the stream shut.
 *
 * A stream closed because the access token lapsed comes back on the first
 * attempt, since the reopen is preceded by a session refresh. Needing eight
 * means something the client cannot fix: the session is genuinely finished, or
 * the route is failing. Neither is repaired by asking again, and the fifteen
 * second poll still shows messages, so the attempts stop rather than running
 * for the life of the page.
 */
const MAX_REOPEN_ATTEMPTS = 8;

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
    /** Set by the cleanup, so work already scheduled stops touching a dead hook. */
    let disposed = false;
    let source: EventSource | null = null;
    let reopenTimer: ReturnType<typeof setTimeout> | undefined;
    /** Consecutive reopens since the last successful connection. */
    let reopenAttempts = 0;

    function handleOpen() {
      setConnected(true);
      // The connection is up, so whatever made the last one fail is behind us and
      // the next failure starts its backoff from the beginning.
      reopenAttempts = 0;
      if (hasConnectedBefore.current) {
        // A reconnect, not the first connection. Anything that happened while the stream was
        // down was never delivered (the server keeps no history and Redis pub/sub holds
        // nothing for an absent subscriber), so the whole of chat is refetched rather than
        // trusting a cache that may have missed a change.
        invalidateEverything();
      }
      hasConnectedBefore.current = true;
    }

    function handleChat(event: unknown) {
      try {
        const parsed = parseChatStreamEvent(
          JSON.parse((event as MessageEvent).data)
        );
        if (parsed) applyEvent(parsed);
      } catch (error) {
        logger.warn('Discarding an unreadable chat stream frame', { error });
      }
    }

    /**
     * Reports the disconnection, and reopens the stream when the browser will not.
     *
     * The two cases behind one `error` event are not the same failure. A dropped
     * connection leaves the source CONNECTING and the browser retries on its own
     * using the server's retry interval, so the right move is to do nothing. A
     * non-200 response, which is what the BFF returns once the access token in the
     * session cookie has expired, is fatal to `EventSource`: it closes the source
     * and never asks again. The server ends every stream at ten minutes by design,
     * so a reconnect landing on an expired token is routine, and without this the
     * stream would stay shut until the next full page load.
     */
    function handleError() {
      // Reporting disconnection is what puts the polling fallback back on its
      // faster cadence in the meantime.
      setConnected(false);

      if (!source || source.readyState !== EVENT_SOURCE_CLOSED) {
        return;
      }

      scheduleReopen();
    }

    function scheduleReopen() {
      if (disposed || reopenTimer) {
        return;
      }

      if (reopenAttempts >= MAX_REOPEN_ATTEMPTS) {
        logger.warn(
          'Chat stream stayed shut after repeated reopens, falling back to polling',
          { attempts: reopenAttempts }
        );
        return;
      }

      const delay = Math.min(
        REOPEN_BASE_DELAY_MS * 2 ** reopenAttempts,
        REOPEN_MAX_DELAY_MS
      );
      reopenAttempts += 1;

      reopenTimer = setTimeout(() => {
        reopenTimer = undefined;
        void reopen();
      }, delay);
    }

    async function reopen() {
      if (disposed) return;

      // The status behind the close is not visible from here, so rather than guess
      // at an expired token this asks the session layer for a fresh one every time.
      // It is the same single-flight path the API client uses, and it exchanges
      // nothing when the token is still good, so an unnecessary call costs one round
      // trip and cannot race another refresh into revoking the token chain.
      await refreshSessionOnce();

      if (disposed) return;

      source?.close();
      connect();
    }

    function connect() {
      const opened = new EventSource(STREAM_URL);
      source = opened;

      // EventSource's own open event, which fires on every successful connection including a
      // reconnect. The server's opening frame is named "ready" precisely so it cannot be
      // confused with this one.
      opened.addEventListener('open', handleOpen);
      opened.addEventListener('chat', handleChat);
      opened.addEventListener('error', handleError);
    }

    connect();

    return () => {
      disposed = true;
      clearTimeout(reopenTimer);
      source?.close();
      setConnected(false);
    };
  }, [applyEvent, invalidateEverything]);

  return { connected };
}
