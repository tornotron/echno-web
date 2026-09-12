/**
 * The decided-requests view of the regularization queue.
 *
 * Backed by the widened register, `GET /attendance-regularizations/web`,
 * which echno-backend#655 gave `status`, `approvedById` and `requestedById`
 * parameters. Core 8.5.0 still only wraps the pending queue
 * (`usePendingRegularizations`), so this hook stays in web until core carries
 * the register. It keys under core's `attendanceRegularizationKeys.all`, so
 * the invalidation core's process mutation already does reaches it, and
 * parses each row through core's own parser rather than a second one.
 *
 * The register is a Spring page and answers with the base DTO, without the
 * employee, project and date enrichment the pending queue carries.
 */

import { useQuery } from '@tanstack/react-query';
import { attendanceRegularizationKeys } from '@tornotron/echno-core/attendance-regularization/hooks';
import {
  parseAttendanceRegularization,
  type AttendanceRegularization,
} from '@tornotron/echno-core/attendance/types';
import { api } from '@/lib/api/api-client';

/** A decision the register can be narrowed to. */
export type RegisterStatus = 'APPROVED' | 'REJECTED';

export interface RegularizationRegisterParams {
  /** Narrow to one outcome; omit for both. */
  status?: RegisterStatus;
  /** Employee id of the approver, as stamped on the row. */
  approvedById?: number;
  /** Employee id of the requester. */
  requestedById?: number;
}

export interface RegularizationRegisterPage {
  rows: AttendanceRegularization[];
  /** Rows on the server matching the filter, which may exceed `rows`. */
  totalElements: number;
}

/** One page of the register, sized so a filtered view arrives whole. */
export const REGISTER_PAGE_SIZE = 200;

export function registerQueryKey(params: RegularizationRegisterParams) {
  return [
    ...attendanceRegularizationKeys.all,
    'register',
    {
      status: params.status ?? null,
      approvedById: params.approvedById ?? null,
      requestedById: params.requestedById ?? null,
    },
  ] as const;
}

/** The query string sent for a register page; unset filters are not sent. */
export function registerQuery(
  params: RegularizationRegisterParams
): Record<string, string | number> {
  const query: Record<string, string | number> = {
    pageNo: 0,
    pageSize: REGISTER_PAGE_SIZE,
  };
  if (params.status) query.status = params.status;
  if (params.approvedById != null) query.approvedById = params.approvedById;
  if (params.requestedById != null) query.requestedById = params.requestedById;
  return query;
}

export async function fetchRegularizationRegister(
  params: RegularizationRegisterParams
): Promise<RegularizationRegisterPage> {
  const data = (await api.get(
    '/attendance-regularizations/web',
    registerQuery(params)
  )) as { content?: unknown[]; totalElements?: number } | null;
  const content = Array.isArray(data?.content) ? data.content : [];
  const rows = content.map((row) => parseAttendanceRegularization(row));
  return { rows, totalElements: data?.totalElements ?? rows.length };
}

/**
 * Decided regularization requests, narrowed on the server. Disabled while
 * `enabled` is false so the pending tab never pays for a register it is not
 * showing.
 */
export function useRegularizationRegister(
  params: RegularizationRegisterParams,
  enabled = true
) {
  return useQuery({
    queryKey: registerQueryKey(params),
    queryFn: () => fetchRegularizationRegister(params),
    enabled,
  });
}
