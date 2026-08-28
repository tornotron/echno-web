// services/checklist-template-service.ts
//
// Typed client for the checklist-template endpoints
// (`/checklist-templates/web`, resolved against the `/api/v1` base).
//
// There is no delete: a template that has stopped being used is deactivated by
// sending `active: false` on an update. Updating also bumps the server-side
// version counter and replaces the item list wholesale, so a save always sends
// every check point, not a diff.

import { api } from '@tornotron/echno-core';
import {
  type ChecklistTemplate,
  type ChecklistTemplateRequest,
  type InspectionTrade,
  type StarterChecklistTemplate,
  checklistTemplateRequestToJson,
  parseChecklistTemplate,
  parseStarterChecklistTemplate,
} from '@/types/inspection/checklist-template';

const BASE = '/checklist-templates/web';

/** Optional filters for the template list. */
export interface ChecklistTemplateListParams {
  trade?: InspectionTrade;
  active?: boolean;
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
  params?: ChecklistTemplateListParams
): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const query: Record<string, string | number | boolean> = {};
  if (params.trade) query.trade = params.trade;
  if (params.active != null) query.active = params.active;
  if (params.page != null) query.page = params.page;
  if (params.size != null) query.size = params.size;
  return Object.keys(query).length > 0 ? query : undefined;
}

/** Checklist Template Service — reusable per-trade checklist definitions. */
export const checklistTemplateService = {
  /** `GET /checklist-templates/web` -> `Page<ChecklistTemplateDto>`. */
  async getAll(
    params?: ChecklistTemplateListParams
  ): Promise<ChecklistTemplate[]> {
    const data = await api.get<unknown>(BASE, toQuery(params));
    return pageContent(data).map((row) => parseChecklistTemplate(row));
  },

  /** `GET /checklist-templates/web/{id}` -> `ChecklistTemplateDto`. */
  async getById(id: string): Promise<ChecklistTemplate> {
    return parseChecklistTemplate(await api.get<Raw>(`${BASE}/${id}`));
  },

  /**
   * `POST /checklist-templates/web` -> `ChecklistTemplateDto`.
   *
   * Returns 409 when the organization already has a template for the trade;
   * one trade carries one template.
   */
  async create(req: ChecklistTemplateRequest): Promise<ChecklistTemplate> {
    return parseChecklistTemplate(
      await api.post<Raw>(BASE, checklistTemplateRequestToJson(req))
    );
  },

  /**
   * `PUT /checklist-templates/web/{id}` -> `ChecklistTemplateDto`.
   *
   * Replaces the item list and bumps `version`. The trade is immutable, so it
   * must be sent unchanged.
   */
  async update(
    id: string,
    req: ChecklistTemplateRequest
  ): Promise<ChecklistTemplate> {
    return parseChecklistTemplate(
      await api.put<Raw>(`${BASE}/${id}`, checklistTemplateRequestToJson(req))
    );
  },

  /**
   * `GET /checklist-templates/web/starters` -> `StarterChecklistTemplateDto[]`.
   * Unpaged: the starter set is product-supplied and small.
   */
  async getStarters(): Promise<StarterChecklistTemplate[]> {
    const data = await api.get<Raw[]>(`${BASE}/starters`);
    return Array.isArray(data)
      ? data.map((row) => parseStarterChecklistTemplate(row))
      : [];
  },

  /**
   * `POST /checklist-templates/web/starters/{trade}/adopt` ->
   * `ChecklistTemplateDto`. Copies a starter into the organization as an
   * editable template of its own.
   */
  async adoptStarter(trade: InspectionTrade): Promise<ChecklistTemplate> {
    return parseChecklistTemplate(
      await api.post<Raw>(`${BASE}/starters/${trade}/adopt`)
    );
  },
};
