import { inspectionService as coreInspectionService } from '@tornotron/echno-core/inspection/services';
import type {
  Inspection,
  CreateInspectionRequest,
  UpdateInspectionRequest,
} from '@tornotron/echno-core/inspection/types';

export const inspectionService = {
  async getAll(): Promise<Inspection[]> {
    return coreInspectionService.getAll();
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
