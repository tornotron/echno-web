// services/chat-service.ts
//
// Thin wrapper around the backend chat room REST endpoints (web-direct variants).

import { api } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import { ChatRoom, parseChatRoom } from '@/types/chat';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

const BASE = '/chat/rooms/web';

export const chatService = {
  /**
   * Fetch all chat rooms for the current user. The backend scopes rooms to the
   * caller's tenant from the session, so no organization filter is sent.
   */
  async getRooms(organizationId?: number): Promise<ChatRoom[]> {
    try {
      void organizationId;
      const data = await api.get<Raw>(BASE);
      const rows: Raw[] = Array.isArray(data) ? data : (data?.content ?? []);
      return rows.map((row) => parseChatRoom(row));
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
      const raw = await api.get<Raw>(`${BASE}/${id}`);
      return parseChatRoom(raw);
    } catch (error) {
      logger.error(`Failed to fetch chat room ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create or get an existing direct message room with a given employee.
   * The backend endpoint is idempotent (find-or-create).
   */
  async createDirectRoom(employeeId: number): Promise<ChatRoom> {
    try {
      const raw = await api.post<Raw>(`${BASE}/direct`, { employeeId });
      return parseChatRoom(raw);
    } catch (error) {
      logger.error('Failed to create direct room:', error);
      throw error;
    }
  },

  /**
   * Archive or unarchive a room for the whole conversation. Any participant may
   * toggle it; the backend returns the updated room.
   */
  async setArchived(roomId: number, archived: boolean): Promise<ChatRoom> {
    try {
      const raw = await api.post<Raw>(`${BASE}/${roomId}/archive`, { archived });
      return parseChatRoom(raw);
    } catch (error) {
      logger.error(`Failed to set archived state on room ${roomId}:`, error);
      throw error;
    }
  },

  /**
   * Mark all messages in a room as read.
   */
  async markAsRead(roomId: number): Promise<void> {
    try {
      await api.post<void>(`${BASE}/${roomId}/read`);
    } catch (error) {
      logger.error(`Failed to mark room ${roomId} as read:`, error);
      throw error;
    }
  },
};
