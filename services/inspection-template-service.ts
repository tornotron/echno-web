import {
  type CreateInspectionTemplateRequest,
  type InspectionTemplate,
  type InspectionTemplateVersion,
  type UpdateInspectionTemplateRequest,
} from '@/types/inspection';
import { mockTemplateApi } from './inspection-mock';

// TODO: Backend not built yet — every method is served by `inspection-mock.ts`.
//   See the note in inspection-service.ts for the cut-over steps.

// import { api } from '@/lib/api/api-client';
// import {
//   parseInspectionTemplate,
//   parseInspectionTemplateVersion,
//   templateRequestToJson,
// } from '@/types/inspection';
//
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// type Raw = any;

/** Thin wrapper around the backend inspection-template REST endpoints. */
export const inspectionTemplateService = {
  /** `GET /inspection-templates/web` → `InspectionTemplateDto[]`. */
  async getAll(): Promise<InspectionTemplate[]> {
    // const raw = await api.get<Raw[]>('/inspection-templates/web');
    // return raw.map((item) => parseInspectionTemplate(item));
    return mockTemplateApi.getAll();
  },

  /** `GET /inspection-templates/web/{id}` → `InspectionTemplateDto`. */
  async getById(id: number): Promise<InspectionTemplate> {
    // return parseInspectionTemplate(
    //   await api.get<Raw>(`/inspection-templates/web/${id}`)
    // );
    return mockTemplateApi.getById(id);
  },

  /** `GET /inspection-templates/web/{id}/versions` → version snapshots. */
  async getVersions(id: number): Promise<InspectionTemplateVersion[]> {
    // const raw = await api.get<Raw[]>(
    //   `/inspection-templates/web/${id}/versions`
    // );
    // return raw.map((item) => parseInspectionTemplateVersion(item));
    return mockTemplateApi.getVersions(id);
  },

  /** `POST /inspection-templates/web` → `InspectionTemplateDto`. */
  async create(
    dto: CreateInspectionTemplateRequest
  ): Promise<InspectionTemplate> {
    // return parseInspectionTemplate(
    //   await api.post<Raw>(
    //     '/inspection-templates/web',
    //     templateRequestToJson(dto)
    //   )
    // );
    return mockTemplateApi.create(dto);
  },

  /**
   * `PATCH /inspection-templates/web/{id}` → `InspectionTemplateDto`.
   * Passing `publish: true` snapshots the schema into a new version.
   */
  async update(
    id: number,
    dto: UpdateInspectionTemplateRequest
  ): Promise<InspectionTemplate> {
    // return parseInspectionTemplate(
    //   await api.patch<Raw>(
    //     `/inspection-templates/web/${id}`,
    //     templateRequestToJson(dto)
    //   )
    // );
    return mockTemplateApi.update(id, dto);
  },

  /** `DELETE /inspection-templates/web/{id}`. */
  async remove(id: number): Promise<void> {
    // await api.delete(`/inspection-templates/web/${id}`);
    return mockTemplateApi.remove(id);
  },

  /**
   * Instantiates a template as a fresh checklist.
   *
   * `POST /inspection-templates/web/{id}/use` → `InspectionTemplateDto`.
   * Element ids are regenerated so the copy never shares ids with its source.
   */
  async use(id: number, name: string): Promise<InspectionTemplate> {
    // return parseInspectionTemplate(
    //   await api.post<Raw>(`/inspection-templates/web/${id}/use`, { name })
    // );
    return mockTemplateApi.use(id, name);
  },
};
