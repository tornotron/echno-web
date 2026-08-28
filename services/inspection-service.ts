import {
  type CreateInspectionRequest,
  type Inspection,
  type InspectionSubmission,
  type InspectionTemplateVersion,
  type SaveInspectionSubmissionRequest,
  type UpdateInspectionRequest,
} from '@/types/inspection';
import { mockInspectionApi } from './inspection-mock';

// TODO: Backend not built yet — every method is served by `inspection-mock.ts`.
//   Each real call is written out above its mock counterpart. To cut over,
//   delete services/inspection-mock.ts, then in each method delete the mock
//   line and uncomment the two lines above it.

// import { api } from '@/lib/api/api-client';
// import {
//   parseInspection,
//   parseInspectionSubmission,
//   parseInspectionTemplateVersion,
//   submissionRequestToJson,
// } from '@/types/inspection';
//
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// type Raw = any;

/** Thin wrapper around the backend inspection REST endpoints. */
export const inspectionService = {
  /** `GET /inspections/web` → `InspectionDto[]`. */
  async getAll(): Promise<Inspection[]> {
    // const raw = await api.get<Raw[]>('/inspections/web');
    // return raw.map((item) => parseInspection(item));
    return mockInspectionApi.getAll();
  },

  /** `GET /inspections/web/project/{projectId}` → `InspectionDto[]`. */
  async getByProject(projectId: number): Promise<Inspection[]> {
    // const raw = await api.get<Raw[]>(`/inspections/web/project/${projectId}`);
    // return raw.map((item) => parseInspection(item));
    return mockInspectionApi.getByProject(projectId);
  },

  /** `GET /inspections/web/{id}` → `InspectionDto`. */
  async getById(id: number): Promise<Inspection> {
    // return parseInspection(await api.get<Raw>(`/inspections/web/${id}`));
    return mockInspectionApi.getById(id);
  },

  /** `POST /inspections/web` → `InspectionDto`. */
  async create(dto: CreateInspectionRequest): Promise<Inspection> {
    // return parseInspection(await api.post<Raw>('/inspections/web', dto));
    return mockInspectionApi.create(dto);
  },

  /** `PATCH /inspections/web/{id}` → `InspectionDto`. */
  async update(id: number, dto: UpdateInspectionRequest): Promise<Inspection> {
    // return parseInspection(await api.patch<Raw>(`/inspections/web/${id}`, dto));
    return mockInspectionApi.update(id, dto);
  },

  /**
   * The pinned checklist definition for an inspection.
   *
   * `GET /inspections/web/{id}/checklist` → `InspectionTemplateVersionDto`.
   * Returns the immutable version snapshot, never the template's live draft.
   */
  async getChecklist(id: number): Promise<InspectionTemplateVersion> {
    // return parseInspectionTemplateVersion(
    //   await api.get<Raw>(`/inspections/web/${id}/checklist`)
    // );
    return mockInspectionApi.getChecklist(id);
  },

  /** `GET /inspections/web/{id}/submission` → `InspectionSubmissionDto`. */
  async getSubmission(id: number): Promise<InspectionSubmission | null> {
    // const raw = await api.get<Raw | null>(`/inspections/web/${id}/submission`);
    // return raw ? parseInspectionSubmission(raw) : null;
    return mockInspectionApi.getSubmission(id);
  },

  /**
   * Creates or replaces the submission (draft save and final submit share
   * one endpoint; `status` distinguishes them).
   *
   * `POST /inspections/web/{id}/submission` → `InspectionSubmissionDto`.
   */
  async saveSubmission(
    id: number,
    dto: SaveInspectionSubmissionRequest
  ): Promise<InspectionSubmission> {
    // return parseInspectionSubmission(
    //   await api.post<Raw>(
    //     `/inspections/web/${id}/submission`,
    //     submissionRequestToJson(dto)
    //   )
    // );
    return mockInspectionApi.saveSubmission(id, dto);
  },
};
