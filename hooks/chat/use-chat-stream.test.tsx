import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  mock,
  test,
} from 'bun:test';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as realAuth from 'next-auth/react';
import type { ReactNode } from 'react';
import React from 'react';

/**
 * Records every forced session round trip, in order against the stream opens.
 *
 * The reopen path has to refresh before it reconnects, and it has to do so
 * through the one coordinator the API client shares, so the test needs to see
 * both that the refresh happened and where it happened.
 */
const timeline: string[] = [];
mock.module('next-auth/react', () => ({
  ...realAuth,
  getSession: async () => {
    timeline.push('refresh');
    return null;
  },
}));

const { useChatStream } = await import('./use-chat-stream');

/**
 * A stand-in for the browser's EventSource that lets a test drive the stream.
 *
 * happy-dom provides no EventSource, and even where one exists a test cannot make a real
 * server send a frame at the right moment. Instances register themselves so a test can reach
 * the one the hook opened.
 */
class FakeEventSource {
  static instances: FakeEventSource[] = [];

  readonly url: string;
  readonly listeners = new Map<string, ((event: unknown) => void)[]>();
  /** The browser's own field: 0 CONNECTING, 1 OPEN, 2 CLOSED. */
  readyState = 0;
  closed = false;

  constructor(url: string) {
    this.url = url;
    timeline.push('open-stream');
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: unknown) => void) {
    const existing = this.listeners.get(type) ?? [];
    this.listeners.set(type, [...existing, listener]);
  }

  close() {
    this.closed = true;
    this.readyState = 2;
  }

  emit(type: string, payload?: unknown) {
    if (type === 'open') this.readyState = 1;
    for (const listener of this.listeners.get(type) ?? []) {
      listener(payload);
    }
  }

  emitChat(data: unknown) {
    this.emit('chat', { data: JSON.stringify(data) });
  }

  /**
   * What a dropped connection looks like: the source goes back to CONNECTING and
   * the browser retries on its own.
   */
  dropConnection() {
    this.readyState = 0;
    this.emit('error');
  }

  /**
   * What a non-200 response looks like, which is what the BFF returns once the
   * access token in the session cookie has expired. The source is closed for good
   * and the single error event is the only notice of it.
   */
  failWithStatus() {
    this.readyState = 2;
    this.emit('error');
  }
}

/** The stream the hook most recently opened. */
function latest() {
  return FakeEventSource.instances.at(-1)!;
}

/**
 * Runs the scheduled work for `ms` and lets the promises it started settle.
 *
 * The reopen is asynchronous (it refreshes the session first), so advancing the
 * clock alone leaves it half done.
 */
async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
    for (let index = 0; index < 20; index++) {
      await Promise.resolve();
    }
  });
}

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

describe('useChatStream', () => {
  let queryClient: QueryClient;
  let invalidated: unknown[][];

  beforeEach(() => {
    FakeEventSource.instances = [];
    timeline.length = 0;
    (globalThis as Record<string, unknown>).EventSource = FakeEventSource;

    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    invalidated = [];
    const original = queryClient.invalidateQueries.bind(queryClient);
    queryClient.invalidateQueries = ((filters?: { queryKey?: unknown[] }) => {
      if (filters?.queryKey) invalidated.push(filters.queryKey);
      return original(filters as never);
    }) as typeof queryClient.invalidateQueries;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).EventSource;
  });

  function open() {
    const rendered = renderHook(() => useChatStream(), {
      wrapper: wrapper(queryClient),
    });
    const source = FakeEventSource.instances.at(-1)!;
    return { ...rendered, source };
  }

  test('opens one stream against the BFF path', () => {
    const { source } = open();

    expect(FakeEventSource.instances).toHaveLength(1);
    expect(source.url).toBe('/api/v1/chat/stream');
  });

  test('reports connection once the stream opens', async () => {
    const { result, source } = open();

    expect(result.current.connected).toBe(false);
    act(() => {
      source.emit('open');
    });

    await waitFor(() => expect(result.current.connected).toBe(true));
  });

  test('a new message invalidates that room and the room list', async () => {
    const { source } = open();
    act(() => {
      source.emit('open');
    });
    invalidated = [];

    act(() => {
      source.emitChat({
        type: 'MESSAGE_CREATED',
        roomId: 7,
        messageId: 99,
        actorEmployeeId: 10,
      });
    });

    await waitFor(() => expect(invalidated.length).toBeGreaterThan(0));
    expect(invalidated).toContainEqual(['chat-messages', 7]);
    expect(invalidated).toContainEqual(['chat-rooms']);
  });

  test('a message update invalidates the same keys as a new message', async () => {
    const { source } = open();
    act(() => {
      source.emit('open');
    });
    invalidated = [];

    // Edit, delete and reaction all arrive as MESSAGE_UPDATED, and all mean "refetch it".
    act(() => {
      source.emitChat({
        type: 'MESSAGE_UPDATED',
        roomId: 7,
        messageId: 99,
        actorEmployeeId: 10,
      });
    });

    await waitFor(() => expect(invalidated.length).toBeGreaterThan(0));
    expect(invalidated).toContainEqual(['chat-messages', 7]);
  });

  test('a room update touches only the room queries', async () => {
    const { source } = open();
    act(() => {
      source.emit('open');
    });
    invalidated = [];

    act(() => {
      source.emitChat({ type: 'ROOM_UPDATED', roomId: 7, actorEmployeeId: 10 });
    });

    await waitFor(() => expect(invalidated.length).toBeGreaterThan(0));
    expect(invalidated).toContainEqual(['chat-rooms']);
    expect(invalidated).not.toContainEqual(['chat-messages', 7]);
  });

  test('a malformed frame is ignored rather than invalidating anything', async () => {
    const { source } = open();
    act(() => {
      source.emit('open');
    });
    invalidated = [];

    act(() => {
      source.emit('chat', { data: 'not json at all' });
    });
    act(() => {
      source.emitChat({ type: 'SOMETHING_ELSE', roomId: 7 });
    });

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(invalidated).toEqual([]);
  });

  test('a reconnect refetches everything, the first connection does not', async () => {
    const { source } = open();

    act(() => {
      source.emit('open');
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    // Nothing is stale on a first connection: the queries have only just been mounted.
    expect(invalidated).toEqual([]);

    act(() => {
      source.dropConnection();
    });
    act(() => {
      source.emit('open');
    });

    // On a reconnect the gap is unbounded and undelivered frames are gone for good, so the
    // whole of chat is refetched rather than trusting a cache that may have missed a change.
    await waitFor(() => expect(invalidated.length).toBeGreaterThan(0));
    expect(invalidated).toContainEqual(['chat-messages']);
    expect(invalidated).toContainEqual(['chat-rooms']);
  });

  test('closes the stream when the consumer unmounts', () => {
    const { unmount, source } = open();

    act(() => {
      unmount();
    });

    expect(source.closed).toBe(true);
  });

  describe('recovering a stream the browser closed', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('a closed stream is refreshed and reopened', async () => {
      const { result, source } = open();
      act(() => {
        source.emit('open');
      });

      // The BFF answered the ten minute reconnect with 401. EventSource closes and
      // fires one error, and left alone it would never ask again.
      act(() => {
        source.failWithStatus();
      });

      expect(result.current.connected).toBe(false);
      expect(FakeEventSource.instances).toHaveLength(1);

      await advance(1000);

      expect(FakeEventSource.instances).toHaveLength(2);
      expect(latest().url).toBe('/api/v1/chat/stream');
      // The refresh has to come first, otherwise the new stream carries the same
      // expired token and is closed again on arrival.
      expect(timeline).toEqual(['open-stream', 'refresh', 'open-stream']);
    });

    test('a dropped connection is left to the browser to retry', async () => {
      const { source } = open();
      act(() => {
        source.emit('open');
      });

      act(() => {
        source.dropConnection();
      });
      await advance(60_000);

      // Reopening here would race the browser's own retry and put two streams on
      // the same session.
      expect(FakeEventSource.instances).toHaveLength(1);
      expect(timeline).toEqual(['open-stream']);
    });

    test('repeated closes back off and eventually stop', async () => {
      const { source } = open();
      act(() => {
        source.emit('open');
      });

      // Doubling from the server's own retry interval, held at thirty seconds.
      const delays = [1000, 2000, 4000, 8000, 16_000, 30_000, 30_000, 30_000];
      let expected = 1;

      act(() => {
        source.failWithStatus();
      });

      for (const delay of delays) {
        // A tick short of the delay, nothing has reopened yet.
        await advance(delay - 1);
        expect(FakeEventSource.instances).toHaveLength(expected);

        await advance(1);
        expected += 1;
        expect(FakeEventSource.instances).toHaveLength(expected);

        act(() => {
          latest().failWithStatus();
        });
      }

      // Past the ceiling the attempts stop, leaving chat on its polling fallback
      // rather than reopening for the life of the page.
      await advance(120_000);
      expect(FakeEventSource.instances).toHaveLength(expected);
    });

    test('a successful open puts the backoff back to the start', async () => {
      const { source } = open();
      act(() => {
        source.emit('open');
      });

      act(() => {
        source.failWithStatus();
      });
      await advance(1000);
      act(() => {
        latest().emit('open');
      });

      act(() => {
        latest().failWithStatus();
      });
      await advance(1000);

      // Three streams: the original, the first reopen, and this one at the base
      // delay again rather than at the doubled one.
      expect(FakeEventSource.instances).toHaveLength(3);
    });

    test('unmounting cancels a reopen that is already scheduled', async () => {
      const { unmount, source } = open();
      act(() => {
        source.emit('open');
      });

      act(() => {
        source.failWithStatus();
      });
      act(() => {
        unmount();
      });

      await advance(60_000);

      expect(FakeEventSource.instances).toHaveLength(1);
    });
  });
});
