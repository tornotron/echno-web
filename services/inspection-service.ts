import {
  inspectionService as coreInspectionService,
  type InspectionListParams,
} from '@tornotron/echno-core/inspection/services';
import type {
  Inspection,
  CreateInspectionRequest,
  UpdateInspectionRequest,
} from '@tornotron/echno-core/inspection/types';

export type { InspectionListParams } from '@tornotron/echno-core/inspection/services';

/**
 * Inspections.
 *
 * Compliance generation used to live here as `regenerateCompliance`, issued
 * through the shared client with a stretched timeout because it waited on an
 * external model inside the request. No budget could make that work: the run
 * outgrows the sixty-second edge timeout once a jurisdiction has about forty
 * rules. It is now a queued job with its own endpoints and its own service,
 * `complianceJobService`.
 */
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
};
