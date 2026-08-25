// hooks/chat/use-chat-mutations.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chat-service';
import { chatMessageService } from '@/services/chat-message-service';
import { SendMessageData } from '@/types/chat';
import { toast } from '@/lib/styles/toast-styles';
import { logger } from '@/lib/logger';
import { getErrorMessage, getErrorTitle } from '@/lib/utils/error-helpers';

/**
 * Send a new message to a room.
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: number; data: SendMessageData }) =>
      chatMessageService.sendMessage(roomId, data),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Send Message');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to send message:', error);
    },
  });
}

/**
 * Edit an existing message.
 */
export function useEditMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      content,
      roomId,
    }: {
      id: number;
      content: string;
      roomId: number;
    }) =>
      chatMessageService
        .editMessage(id, content)
        .then((msg) => ({ msg, roomId })),
    onSuccess: ({ roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Edit Message');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to edit message:', error);
    },
  });
}

/**
 * Mark a room as read (clears unread count).
 */
export function useMarkRoomAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: number) => chatService.markAsRead(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
    onError: (error) => {
      logger.error('Failed to mark room as read:', error);
    },
  });
}

/**
 * Create or open a direct message room with an employee.
 */
export function useCreateDirectRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: number) =>
      chatService.createDirectRoom(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    },
    onError: (error) => {
      const title = getErrorTitle(error, 'Failed to Start Conversation');
      const description = getErrorMessage(error);
      toast.error(title, { description });
      logger.error('Failed to create direct room:', error);
    },
  });
}
