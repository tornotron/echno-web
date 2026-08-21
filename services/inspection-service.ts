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
  async regenerateCompliance(projectId: number): Promise<Inspection[]> {
    return coreInspectionService.regenerateCompliance(projectId);
  },
};
