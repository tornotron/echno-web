import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import React from 'react';
import { useChatStream } from './use-chat-stream';

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
  onerror: (() => void) | null = null;
  closed = false;

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: (event: unknown) => void) {
    const existing = this.listeners.get(type) ?? [];
    this.listeners.set(type, [...existing, listener]);
  }

  close() {
    this.closed = true;
  }

  emit(type: string, payload?: unknown) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(payload);
    }
  }

  emitChat(data: unknown) {
    this.emit('chat', { data: JSON.stringify(data) });
  }
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
      source.onerror?.();
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
});
