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
   * Send a new message to a room. When files are attached the request goes out
   * as multipart: a JSON `data` part carrying `content` and `replyToId`, plus
   * each file under an `attachments` part. With no files it stays on the plain
   * JSON path. The reply target is carried through in both shapes.
   */
  async sendMessage(
    roomId: number,
    data: SendMessageData
  ): Promise<ChatMessage> {
    try {
      const payload = { content: data.content, replyToId: data.replyToId };
      const raw =
        data.attachments && data.attachments.length > 0
          ? await api.postMultipart<Raw>(`${ROOMS}/${roomId}/messages`, payload, {
              attachments: data.attachments,
            })
          : await api.post<Raw>(`${ROOMS}/${roomId}/messages`, payload);
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

  /**
   * Toggle the caller's emoji reaction on a message. Adds it if absent, removes
   * it if already present, and returns the message with its refreshed grouped
   * reaction list.
   */
  async toggleReaction(id: number, emoji: string): Promise<ChatMessage> {
    try {
      const raw = await api.post<Raw>(`${MESSAGES}/${id}/reactions`, { emoji });
      return parseChatMessage(raw);
    } catch (error) {
      logger.error(`Failed to toggle reaction on message ${id}:`, error);
      throw error;
    }
  },

  /**
   * Soft-delete a message. The backend keeps the row (returns 204) so the web
   * renders a tombstone; only the sender or a room admin may delete it.
   */
  async deleteMessage(id: number): Promise<void> {
    try {
      await api.delete<void>(`${MESSAGES}/${id}`);
    } catch (error) {
      logger.error(`Failed to delete message ${id}:`, error);
      throw error;
    }
  },
};
