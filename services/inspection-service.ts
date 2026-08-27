import { api, ApiError, logger } from '@tornotron/echno-core';
import {
  inspectionService as coreInspectionService,
  type InspectionListParams,
} from '@tornotron/echno-core/inspection/services';
import {
  parseInspection,
  type Inspection,
  type CreateInspectionRequest,
  type UpdateInspectionRequest,
} from '@tornotron/echno-core/inspection/types';

export type { InspectionListParams } from '@tornotron/echno-core/inspection/services';

/**
 * How long the browser is willing to wait for compliance generation.
 *
 * Generation is not a database read: the backend asks an external AI model
 * which of the curated rules apply to the project, and only then writes the
 * results. Measured against staging that call takes 34-47 seconds for the six
 * rules currently curated for Tamil Nadu residential projects, and the time
 * grows with the number of rules in the jurisdiction. The shared API client
 * allows every request 30 seconds, which this one routinely overruns, so it is
 * issued directly with a budget of its own.
 *
 * The ceiling is the reverse proxy in front of the site, which abandons an
 * upstream response after 60 seconds. Staying below that keeps a genuine
 * overrun an application error the UI can explain, rather than a raw gateway
 * page. Retries are off: re-running a 45-second analysis on a slow network
 * would queue a second one behind the first for no benefit.
 */
const COMPLIANCE_GENERATION_TIMEOUT_MS = 50_000;

const COMPLIANCE_REGENERATE_PATH = '/inspections/web/compliance/regenerate';

export const inspectionService = {
  async getAll(params?: InspectionListParams): Promise<Inspection[]> {
    return coreInspectionService.getAll(params);
  },
  async getById(id: string): Promise<Inspection> {
    return coreInspectionService.getById(id);
  },
  async create(req: CreateInspectionRequest): Promise<Inspection> {
    return coreInspectionService.create(req);
  },
  async update(id: string, req: UpdateInspectionRequest): Promise<Inspection> {
    return coreInspectionService.update(id, req);
  },
  // Re-runs AI compliance generation for a project and returns the compliance
  // inspections it produced. Generation is idempotent server-side.
  //
  // This one call does not go through the shared core service, because that
  // service takes the client's default 30-second budget and compliance
  // generation regularly needs more than that. See
  // COMPLIANCE_GENERATION_TIMEOUT_MS above.
  async regenerateCompliance(projectId: number): Promise<Inspection[]> {
    const data = await api.post<unknown>(
      COMPLIANCE_REGENERATE_PATH,
      {},
      { projectId },
      { timeout: COMPLIANCE_GENERATION_TIMEOUT_MS, retries: 0 }
    );
    if (!Array.isArray(data)) {
      logger.warn('Compliance generation returned an unexpected shape');
      return [];
    }
    try {
      return data.map((row) => parseInspection(row));
    } catch (error) {
      logger.error('Failed to parse generated compliance inspections:', error);
      throw new ApiError(
        'The compliance analysis finished but its results could not be read. Reload the page to see them.',
        422
      );
    }
  },
};
