// services/chat-service.ts
//
// Thin wrapper around the backend chat REST endpoints.
// Currently backed by mock data — replace Promise.resolve() calls with
// api.get() / api.post() etc. once the backend is ready.

import { logger } from '@/lib/logger';
import { ChatRoom, ChatRoomType, ChatParticipantRole } from '@/types/chat';
import { mockChatRooms } from '@/components/shared/data/chat';

export const chatService = {
  /**
   * Fetch all chat rooms for the current user within an organization.
   */
  async getRooms(organizationId?: number): Promise<ChatRoom[]> {
    try {
      // TODO: replace with api.get<ChatRoom[]>(`/chat/rooms?orgId=${organizationId}`)
      void organizationId;
      return [...mockChatRooms];
    } catch (error) {
      logger.error('Failed to fetch chat rooms:', error);
      throw error;
    }
  },

  /**
   * Fetch a single chat room by ID.
   */
  async getRoomById(id: number): Promise<ChatRoom> {
    try {
      // TODO: replace with api.get<ChatRoom>(`/chat/rooms/${id}`)
      const room = mockChatRooms.find((r) => r.id === id);
      if (!room) throw new Error(`Chat room ${id} not found`);
      return { ...room };
    } catch (error) {
      logger.error(`Failed to fetch chat room ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create or get an existing direct message room with a given employee.
   */
  async createDirectRoom(employeeId: number): Promise<ChatRoom> {
    try {
      // TODO: replace with api.post<ChatRoom>('/chat/rooms/direct', { employeeId })
      const existing = mockChatRooms.find(
        (r) =>
          r.type === ChatRoomType.direct &&
          r.participants.some((p) => p.employeeId === employeeId)
      );
      if (existing) return { ...existing };

      const newRoom: ChatRoom = {
        id: Date.now(),
        type: ChatRoomType.direct,
        participants: [
          {
            employeeId,
            role: ChatParticipantRole.member,
            joinedAt: new Date(),
          },
        ],
        unreadCount: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return newRoom;
    } catch (error) {
      logger.error('Failed to create direct room:', error);
      throw error;
    }
  },

  /**
   * Mark all messages in a room as read.
   */
  async markAsRead(roomId: number): Promise<void> {
    try {
      // TODO: replace with api.post<void>(`/chat/rooms/${roomId}/read`)
      void roomId;
      return;
    } catch (error) {
      logger.error(`Failed to mark room ${roomId} as read:`, error);
      throw error;
    }
  },
};
