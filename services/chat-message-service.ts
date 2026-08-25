// services/chat-message-service.ts
//
// Thin wrapper around the backend chat message REST endpoints (web-direct variants).

import { api } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import { ChatMessage, SendMessageData, parseChatMessage } from '@/types/chat';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

const ROOMS = '/chat/rooms/web';
const MESSAGES = '/chat/messages/web';

/** Default page size for the initial message load. */
const DEFAULT_PAGE_SIZE = 50;

export const chatMessageService = {
  /**
   * Fetch messages for a room. The backend returns a Spring `Page<ChatMessage>`
   * ordered `createdAt` DESC; we unwrap `content` and reverse it so the caller
   * receives messages oldest-first, which is the order the message list renders.
   */
  async getMessages(
    roomId: number,
    params?: { page?: number; size?: number }
  ): Promise<ChatMessage[]> {
    try {
      const data = await api.get<Raw>(`${ROOMS}/${roomId}/messages`, {
        page: params?.page ?? 0,
        size: params?.size ?? DEFAULT_PAGE_SIZE,
      });
      const rows: Raw[] = Array.isArray(data) ? data : (data?.content ?? []);
      const parsed = rows.map((row) => parseChatMessage(row));
      // Page is newest-first; reverse to chronological (oldest-first) for display.
      return parsed.reverse();
    } catch (error) {
      logger.error(`Failed to fetch messages for room ${roomId}:`, error);
      throw error;
    }
  },

  /**
   * Send a new message to a room. The backend accepts text plus an optional
   * reply target only; mentions, entity mentions and attachments are not yet
   * persisted server-side, so they are not sent.
   */
  async sendMessage(
    roomId: number,
    data: SendMessageData
  ): Promise<ChatMessage> {
    try {
      const raw = await api.post<Raw>(`${ROOMS}/${roomId}/messages`, {
        content: data.content,
        replyToId: data.replyToId,
      });
      return parseChatMessage(raw);
    } catch (error) {
      logger.error(`Failed to send message to room ${roomId}:`, error);
      throw error;
    }
  },

  /**
   * Edit the content of an existing message.
   */
  async editMessage(id: number, content: string): Promise<ChatMessage> {
    try {
      const raw = await api.patch<Raw>(`${MESSAGES}/${id}`, { content });
      return parseChatMessage(raw);
    } catch (error) {
      logger.error(`Failed to edit message ${id}:`, error);
      throw error;
    }
  },
};
