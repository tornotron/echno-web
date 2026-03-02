// services/chat-message-service.ts
//
// Thin wrapper around the backend chat message REST endpoints.
// Currently backed by mock data — replace Promise.resolve() calls with
// api.get() / api.post() etc. once the backend is ready.

import { logger } from '@/lib/logger';
import { ChatMessage, ChatEntityType } from '@/types/chat';
import { mockChatMessages } from '@/components/shared/data/chat';

export interface SendMessageData {
  content: string;
  replyToId?: number;
  mentions?: number[];
  entityMentions?: { entityType: ChatEntityType; entityId: number }[];
  attachments?: File[];
}

// In-memory store for messages created during this session (mock only)
const sessionMessages: Record<number, ChatMessage[]> = {};

function getRoomMessages(roomId: number): ChatMessage[] {
  const base = mockChatMessages[roomId] ?? [];
  const session = sessionMessages[roomId] ?? [];
  return [...base, ...session];
}

export const chatMessageService = {
  /**
   * Fetch messages for a room. Supports cursor-based pagination.
   */
  async getMessages(
    roomId: number,
    params?: { before?: number; limit?: number }
  ): Promise<ChatMessage[]> {
    try {
      // TODO: replace with api.get<ChatMessage[]>(`/chat/rooms/${roomId}/messages`, { params })
      void params;
      const messages = getRoomMessages(roomId);
      return messages;
    } catch (error) {
      logger.error(`Failed to fetch messages for room ${roomId}:`, error);
      throw error;
    }
  },

  /**
   * Send a new message to a room.
   */
  async sendMessage(
    roomId: number,
    data: SendMessageData
  ): Promise<ChatMessage> {
    try {
      // TODO: replace with api.postMultipart or api.post for messages without attachments
      const newMessage: ChatMessage = {
        id: Date.now(),
        roomId,
        senderId: 1, // current user — resolved from session in real impl
        content: data.content,
        replyToId: data.replyToId,
        mentions: data.mentions ?? [],
        entityMentions: (data.entityMentions ?? []).map((em) => ({
          entityType: em.entityType,
          entityId: em.entityId,
        })),
        reactions: [],
        isEdited: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (!sessionMessages[roomId]) sessionMessages[roomId] = [];
      sessionMessages[roomId].push(newMessage);

      return newMessage;
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
      // TODO: replace with api.patch<ChatMessage>(`/chat/messages/${id}`, { content })
      for (const messages of Object.values(sessionMessages)) {
        const msg = messages.find((m) => m.id === id);
        if (msg) {
          msg.content = content;
          msg.isEdited = true;
          msg.editedAt = new Date();
          msg.updatedAt = new Date();
          return { ...msg };
        }
      }
      throw new Error(`Message ${id} not found or cannot be edited`);
    } catch (error) {
      logger.error(`Failed to edit message ${id}:`, error);
      throw error;
    }
  },

  /**
   * Soft-delete a message (marks isDeleted = true).
   */
  async deleteMessage(id: number): Promise<void> {
    try {
      // TODO: replace with api.delete(`/chat/messages/${id}`)
      void id;
      return;
    } catch (error) {
      logger.error(`Failed to delete message ${id}:`, error);
      throw error;
    }
  },

  /**
   * Toggle an emoji reaction on a message.
   */
  async toggleReaction(messageId: number, emoji: string): Promise<void> {
    try {
      // TODO: replace with api.post(`/chat/messages/${messageId}/reactions`, { emoji })
      void messageId;
      void emoji;
      return;
    } catch (error) {
      logger.error(`Failed to toggle reaction on message ${messageId}:`, error);
      throw error;
    }
  },
};
