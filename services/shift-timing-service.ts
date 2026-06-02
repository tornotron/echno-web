/**
 * services/shift-timing-service.ts
 *
 * Typed client for the shift-timing endpoints
 * (`/api/v1/shift-timings/web`). Kept in its own module because shift
 * timings are referenced by attendance, scheduling, payroll, and any
 * future roster-based feature — none of which should pull in the broader
 * attendance-settings surface.
 */

import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  createShiftTimingToJson,
  parseShiftTiming,
  updateShiftTimingToJson,
  type ShiftTiming,
  type CreateShiftTimingRequest,
  type UpdateShiftTimingRequest,
} from '@/types/shift-timing';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function safeShift(raw: Raw): ShiftTiming {
  try {
    return parseShiftTiming(raw);
  } catch (error) {
    logger.error('Failed to parse shift timing:', error);
    throw new ApiError('Failed to process shift timing data.', 422);
  }
}

function safeShifts(data: Raw[]): ShiftTiming[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.map((item) => parseShiftTiming(item));
  } catch (error) {
    logger.error('Failed to parse shift timing list:', error);
    throw new ApiError('Failed to process shift timing data.', 422);
  }
}

export const shiftTimingService = {
  async getAll(): Promise<ShiftTiming[]> {
    const data = await api.get<Raw[]>('/shift-timings/web');
    return safeShifts(data);
  },

  async getById(id: number): Promise<ShiftTiming> {
    const data = await api.get<Raw>(`/shift-timings/web/${id}`);
    return safeShift(data);
  },

  async create(dto: CreateShiftTimingRequest): Promise<ShiftTiming> {
    const data = await api.post<Raw>(
      '/shift-timings/web',
      createShiftTimingToJson(dto)
    );
    return safeShift(data);
  },

  async update(
    id: number,
    dto: UpdateShiftTimingRequest
  ): Promise<ShiftTiming> {
    const data = await api.patch<Raw>(
      `/shift-timings/web/${id}`,
      updateShiftTimingToJson(dto)
    );
    return safeShift(data);
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/shift-timings/web/${id}`);
  },
};
