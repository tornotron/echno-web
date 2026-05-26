/**
 * services/shift-timing-service.ts
 *
 * Typed client for shift timing backend endpoints.
 */

import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import { ShiftTiming, parseShiftTiming } from '@/types/attendance';
import {
  CreateShiftTimingRequest,
  UpdateShiftTimingRequest,
  createShiftTimingToJson,
  updateShiftTimingToJson,
} from '@/types/shift-timing';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function safeParseShiftTiming(data: Raw): ShiftTiming {
  try {
    return parseShiftTiming(data);
  } catch (error) {
    logger.error('Failed to parse shift timing:', error);
    throw new ApiError('Failed to process shift timing data.', 422);
  }
}

function safeParseShiftTimings(data: Raw[]): ShiftTiming[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.map((item) => parseShiftTiming(item));
  } catch (error) {
    logger.error('Failed to parse shift timings:', error);
    throw new ApiError('Failed to process shift timings data.', 422);
  }
}

export const shiftTimingService = {
  async getAll(): Promise<ShiftTiming[]> {
    const data = await api.get<Raw[]>('/shift-timings/web');
    return safeParseShiftTimings(data);
  },

  async getById(id: number): Promise<ShiftTiming> {
    const data = await api.get<Raw>(`/shift-timings/web/${id}`);
    return safeParseShiftTiming(data);
  },

  async create(dto: CreateShiftTimingRequest): Promise<ShiftTiming> {
    const data = await api.post<Raw>(
      '/shift-timings/web',
      createShiftTimingToJson(dto)
    );
    return safeParseShiftTiming(data);
  },

  async update(
    id: number,
    dto: UpdateShiftTimingRequest
  ): Promise<ShiftTiming> {
    const data = await api.patch<Raw>(
      `/shift-timings/web/${id}`,
      updateShiftTimingToJson(dto)
    );
    return safeParseShiftTiming(data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/shift-timings/web/${id}`);
  },
};
