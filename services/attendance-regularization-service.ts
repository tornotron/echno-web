/**
 * services/attendance-regularization-service.ts
 *
 * Typed client for the attendance-regularization endpoints
 * (`/api/v1/attendance-regularizations/web`). Lives in its own module so
 * the regularization queue UI can depend on just this surface without
 * pulling in the broader attendance-core service.
 *
 * Request-body conversion lives in `types/attendance/regularization-create.ts`.
 */

import { api, ApiError } from '@/lib/api/api-client';
import { logger } from '@/lib/logger';
import {
  createRegularizationToJson,
  type CreateRegularizationRequest,
  type RegularizationDetail,
} from '@/types/attendance';
import { parsePositiveInt } from '@/types/parse-id';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

// ─── Parser ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRegularizationDetail(raw: any): RegularizationDetail {
  return {
    id: parsePositiveInt(raw.id, 'parseRegularizationDetail.id'),
    attendanceId: parsePositiveInt(
      raw.attendanceId,
      'parseRegularizationDetail.attendanceId'
    ),
    reason: raw.reason ?? '',
    requestedBy: raw.requestedBy ?? '',
    requestedAt: new Date(raw.requestedAt),
    approvedBy: raw.approvedBy ?? undefined,
    approvedAt: raw.approvedAt ? new Date(raw.approvedAt) : undefined,
    status: (raw.status?.toLowerCase() ?? 'pending') as
      | 'pending'
      | 'approved'
      | 'rejected',
    rejectionReason: raw.rejectionReason ?? undefined,
    missingEvents: Array.isArray(raw.missingEvents) ? raw.missingEvents : [],
    // Optional context fields — only present when the endpoint enriches them.
    employeeId: raw.employeeId ?? undefined,
    employeeName: raw.employeeName ?? undefined,
    attendanceDate: raw.attendanceDate
      ? new Date(raw.attendanceDate)
      : undefined,
    projectId: raw.projectId ?? undefined,
    projectName: raw.projectName ?? undefined,
  };
}

function safeRegularization(raw: Raw): RegularizationDetail {
  try {
    return parseRegularizationDetail(raw);
  } catch (error) {
    logger.error('Failed to parse regularization:', error);
    throw new ApiError('Failed to process regularization data.', 422);
  }
}

function safeRegularizations(data: Raw[]): RegularizationDetail[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.map((element) => parseRegularizationDetail(element));
  } catch (error) {
    logger.error('Failed to parse regularization list:', error);
    throw new ApiError('Failed to process regularization data.', 422);
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const attendanceRegularizationService = {
  async request(
    dto: CreateRegularizationRequest,
    requestedBy: string
  ): Promise<RegularizationDetail> {
    const data = await api.post<Raw>(
      '/attendance-regularizations/web/request',
      createRegularizationToJson(dto),
      { requestedBy }
    );
    return safeRegularization(data);
  },

  async process(
    id: number,
    status: 'APPROVED' | 'REJECTED',
    approvedBy: string,
    rejectionReason?: string
  ): Promise<RegularizationDetail> {
    const data = await api.post<Raw>(
      `/attendance-regularizations/web/${id}/process`,
      { status, rejectionReason },
      { approvedBy }
    );
    return safeRegularization(data);
  },

  async getPending(): Promise<RegularizationDetail[]> {
    const data = await api.get<Raw[]>(
      '/attendance-regularizations/web/pending'
    );
    return safeRegularizations(data);
  },

  async getById(id: number): Promise<RegularizationDetail> {
    const data = await api.get<Raw>(`/attendance-regularizations/web/${id}`);
    return safeRegularization(data);
  },
};
