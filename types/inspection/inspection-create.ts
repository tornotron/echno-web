import type { InspectionStatus, InspectionType } from './inspection-enums';

export interface CreateInspectionRequest {
  title: string;
  description?: string;
  type: InspectionType;
  projectId: number;
  location?: string;
  /** ISO date (yyyy-MM-dd). */
  inspectionDate: string;
  inspectorId?: number;
  /**
   * Template to instantiate. The backend pins the template's current published
   * version onto the inspection; omitting it creates an inspection with no
   * checklist, which the runtime renders as an empty state.
   */
  templateId?: number;
}

export interface UpdateInspectionRequest {
  title?: string;
  description?: string;
  status?: InspectionStatus;
  location?: string;
  inspectionDate?: string;
  inspectorId?: number;
  templateId?: number;
}
