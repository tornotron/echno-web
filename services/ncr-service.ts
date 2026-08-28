// services/ncr-service.ts
//
// Typed client for the NCR endpoints (`/ncrs/web`, resolved against the
// `/api/v1` base).
//
// The lifecycle is driven by one endpoint per transition rather than a
// settable status field, so each step below is its own method and the UI can
// only offer a move the backend will accept. See `availableNcrActions` in
// types/inspection/ncr.ts for which are legal from a given status.

import { api } from '@tornotron/echno-core';
import {
  type AssignNcrRequest,
  type CreateNcrRequest,
  type Ncr,
  type NcrRemarksRequest,
  type NcrStatus,
  type NcrType,
  parseNcr,
} from '@/types/inspection/ncr';

const BASE = '/ncrs/web';

/** Optional filters for the NCR list. */
export interface NcrListParams {
  /** Restrict to the NCRs raised against one inspection. */
  inspectionId?: string;
  type?: NcrType;
  status?: NcrStatus;
  /** Restrict to the NCRs one engineer is accountable for. */
  siteEngineerId?: number;
  /** `true` returns the punch list: every NCR that is not yet closed. */
  open?: boolean;
  page?: number;
  size?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

/** Unwraps a Spring `Page` envelope, tolerating a bare array. */
function pageContent(data: unknown): Raw[] {
  if (Array.isArray(data)) return data as Raw[];
  const content = (data as { content?: unknown } | null)?.content;
  return Array.isArray(content) ? (content as Raw[]) : [];
}

function toQuery(
  params?: NcrListParams
): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const query: Record<string, string | number | boolean> = {};
  if (params.inspectionId) query.inspectionId = params.inspectionId;
  if (params.type) query.type = params.type;
  if (params.status) query.status = params.status;
  if (params.siteEngineerId != null)
    query.siteEngineerId = params.siteEngineerId;
  if (params.open != null) query.open = params.open;
  if (params.page != null) query.page = params.page;
  if (params.size != null) query.size = params.size;
  return Object.keys(query).length > 0 ? query : undefined;
}

/** NCR Service — non-conformance reports and their sign-off workflow. */
export const ncrService = {
  /** `GET /ncrs/web` -> `Page<NcrDto>`, unwrapped to a plain array. */
  async getAll(params?: NcrListParams): Promise<Ncr[]> {
    const data = await api.get<unknown>(BASE, toQuery(params));
    return pageContent(data).map((row) => parseNcr(row));
  },

  /** `GET /ncrs/web/{id}` -> `NcrDto`. */
  async getById(id: string): Promise<Ncr> {
    return parseNcr(await api.get<Raw>(`${BASE}/${id}`));
  },

  /** `POST /ncrs/web` -> `NcrDto`. Number, type and raiser are server-set. */
  async create(req: CreateNcrRequest): Promise<Ncr> {
    return parseNcr(await api.post<Raw>(BASE, req));
  },

  /** `POST /ncrs/web/{id}/assign` -> `NcrDto`. */
  async assign(id: string, req: AssignNcrRequest): Promise<Ncr> {
    return parseNcr(await api.post<Raw>(`${BASE}/${id}/assign`, req));
  },

  /** `POST /ncrs/web/{id}/corrective-action-complete` -> `NcrDto`. */
  async completeCorrectiveAction(
    id: string,
    req?: NcrRemarksRequest
  ): Promise<Ncr> {
    return parseNcr(
      await api.post<Raw>(`${BASE}/${id}/corrective-action-complete`, req ?? {})
    );
  },

  /** `POST /ncrs/web/{id}/verify` -> `NcrDto`. */
  async verify(id: string, req?: NcrRemarksRequest): Promise<Ncr> {
    return parseNcr(await api.post<Raw>(`${BASE}/${id}/verify`, req ?? {}));
  },

  /** `POST /ncrs/web/{id}/reject` -> `NcrDto`. Sends it back for rework. */
  async reject(id: string, req?: NcrRemarksRequest): Promise<Ncr> {
    return parseNcr(await api.post<Raw>(`${BASE}/${id}/reject`, req ?? {}));
  },

  /** `POST /ncrs/web/{id}/reopen` -> `NcrDto`. */
  async reopen(id: string, req?: NcrRemarksRequest): Promise<Ncr> {
    return parseNcr(await api.post<Raw>(`${BASE}/${id}/reopen`, req ?? {}));
  },

  /** `POST /ncrs/web/{id}/close` -> `NcrDto`. Takes no body. */
  async close(id: string): Promise<Ncr> {
    return parseNcr(await api.post<Raw>(`${BASE}/${id}/close`));
  },
};
