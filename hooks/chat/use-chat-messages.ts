// hooks/chat/use-chat-messages.ts

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { chatMessageService } from '@/services/chat-message-service';
import { useEmployees } from '@tornotron/echno-core/employee/hooks';
import { useUserEmployees } from '@tornotron/echno-core/user/hooks';
import { ChatMessage } from '@/types/chat';
import { Employee } from '@tornotron/echno-core/employee/types';
import { shouldRetry } from '@/lib/query/retry';
import { useChatStreamStatus } from '@/features/chat/components/chat-stream-provider';

/**
 * How often to poll while the live stream is connected, and while it is not.
 *
 * Polling is kept rather than removed once the stream works. Redis pub/sub delivers at most
 * once and keeps nothing for a subscriber that was briefly absent, so a dropped frame is
 * possible; the slow poll is what repairs it. The fast cadence is the original behaviour, and
 * is what a client whose stream cannot be established at all falls back to.
 */
const POLL_WHILE_STREAMING_MS = 60 * 1000;
const POLL_WITHOUT_STREAM_MS = 15 * 1000;

function resolveMessageEmployees(
  messages: ChatMessage[],
  employees: Employee[]
): ChatMessage[] {
  return messages.map((msg) => ({
    ...msg,
    sender: employees.find((e) => e.id === msg.senderId),
    replyTo: msg.replyTo
      ? {
          ...msg.replyTo,
          sender: employees.find((e) => e.id === msg.replyTo!.senderId),
        }
      : undefined,
  }));
}

/**
 * Hook to fetch messages for a chat room with resolved sender Employee objects.
 */
export function useChatMessages(roomId?: number) {
  const { connected } = useChatStreamStatus();

  const messagesQuery = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: () => {
      if (!roomId) throw new Error('Room ID is required');
      return chatMessageService.getMessages(roomId);
    },
    enabled: !!roomId,
    staleTime: connected ? POLL_WHILE_STREAMING_MS : POLL_WITHOUT_STREAM_MS,
    refetchInterval: connected
      ? POLL_WHILE_STREAMING_MS
      : POLL_WITHOUT_STREAM_MS,
    retry: shouldRetry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });

  const { data: allEmployees = [] } = useEmployees();
  const { data: userEmployees = [] } = useUserEmployees();

  const employees = useMemo(() => {
    const map = new Map<number, Employee>();
    for (const e of [...allEmployees, ...userEmployees]) {
      if (e.id !== undefined) map.set(e.id, e);
    }
    return [...map.values()];
  }, [allEmployees, userEmployees]);

  const data = useMemo(() => {
    if (!messagesQuery.data) return messagesQuery.data;
    return resolveMessageEmployees(messagesQuery.data, employees);
  }, [messagesQuery.data, employees]);

  return { ...messagesQuery, data };
}
