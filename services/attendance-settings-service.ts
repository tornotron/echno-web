/**
 * services/attendance-settings-service.ts
 *
 * Typed client for the attendance-settings endpoints
 * (`/api/v1/attendance-settings/web`) — covers attendance profiles plus the
 * org-level and per-project effective settings.
 *
 * Shift timings live in their own module (`shift-timing-service.ts`) because
 * they're consumed by attendance, scheduling, payroll, and rosters.
 */

import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  createAttendanceProfileToJson,
  updateAttendanceProfileToJson,
  parseAttendanceProfile,
  type AttendanceProfile,
  type CreateAttendanceProfileRequest,
  type UpdateAttendanceProfileRequest,
} from '@/types/attendance';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

function safeProfile(raw: Raw): AttendanceProfile {
  try {
    return parseAttendanceProfile(raw);
  } catch (error) {
    logger.error('Failed to parse attendance profile:', error);
    throw new ApiError('Failed to process attendance profile data.', 422);
  }
}

function safeProfiles(data: Raw[]): AttendanceProfile[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.map((item) => parseAttendanceProfile(item));
  } catch (error) {
    logger.error('Failed to parse attendance profile list:', error);
    throw new ApiError('Failed to process attendance profile data.', 422);
  }
}

export const attendanceSettingsService = {
  // ── Attendance Profiles ────────────────────────────────────────────────────

  async getProfiles(): Promise<AttendanceProfile[]> {
    const data = await api.get<Raw[]>('/attendance-settings/web');
    return safeProfiles(data);
  },

  async createProfile(
    dto: CreateAttendanceProfileRequest
  ): Promise<AttendanceProfile> {
    const data = await api.post<Raw>(
      '/attendance-settings/web',
      createAttendanceProfileToJson(dto)
    );
    return safeProfile(data);
  },

  async updateProfile(
    id: number,
    dto: UpdateAttendanceProfileRequest
  ): Promise<AttendanceProfile> {
    const data = await api.patch<Raw>(
      `/attendance-settings/web/${id}`,
      updateAttendanceProfileToJson(dto)
    );
    return safeProfile(data);
  },

  async deleteProfile(id: number): Promise<void> {
    await api.delete(`/attendance-settings/web/${id}`);
  },

  // ── Effective settings ─────────────────────────────────────────────────────

  async getOrgSettings(): Promise<AttendanceProfile> {
    const data = await api.get<Raw>('/attendance-settings/web/org');
    return safeProfile(data);
  },

  async getSettingsByProject(projectId: number): Promise<AttendanceProfile> {
    const data = await api.get<Raw>(
      `/attendance-settings/web/project/${projectId}`
    );
    return safeProfile(data);
  },
};
