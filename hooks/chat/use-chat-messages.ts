// hooks/chat/use-chat-messages.ts

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { chatMessageService } from '@/services/chat-message-service';
import { useEmployees } from '@/hooks/employee';
import { useUserEmployees } from '@/hooks/user/use-user';
import { ChatMessage } from '@/types/chat';
import { Employee } from '@/types/employee/employee';
import { shouldRetry } from '@/lib/query/retry';

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
  const messagesQuery = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: () => {
      if (!roomId) throw new Error('Room ID is required');
      return chatMessageService.getMessages(roomId);
    },
    enabled: !!roomId,
    staleTime: 15 * 1000, // 15 seconds — frequent polling cadence placeholder
    refetchInterval: 15 * 1000, // poll every 15s until WebSocket is wired
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
