import {
  type CreateNcrCommentRequest,
  type CreateNcrDefectRequest,
  type NcrComment,
  type NcrDefect,
  type UpdateNcrDefectRequest,
} from '@/types/inspection';
import { mockNcrApi } from './inspection-mock';

// TODO: Backend not built yet — every method is served by `inspection-mock.ts`.
//   See the note in inspection-service.ts for the cut-over steps.

// import { api } from '@/lib/api/api-client';
// import { parseNcrComment, parseNcrDefect } from '@/types/inspection';
//
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// type Raw = any;

/** Thin wrapper around the backend NCR / defect REST endpoints. */
export const ncrDefectService = {
  /** `GET /ncr-defects/web` → `NcrDefectDto[]`. */
  async getAll(): Promise<NcrDefect[]> {
    // const raw = await api.get<Raw[]>('/ncr-defects/web');
    // return raw.map((item) => parseNcrDefect(item));
    return mockNcrApi.getAll();
  },

  /** `GET /ncr-defects/web/project/{projectId}` → `NcrDefectDto[]`. */
  async getByProject(projectId: number): Promise<NcrDefect[]> {
    // const raw = await api.get<Raw[]>(`/ncr-defects/web/project/${projectId}`);
    // return raw.map((item) => parseNcrDefect(item));
    return mockNcrApi.getByProject(projectId);
  },

  /** `GET /ncr-defects/web/inspection/{inspectionId}` → `NcrDefectDto[]`. */
  async getByInspection(inspectionId: number): Promise<NcrDefect[]> {
    // const raw = await api.get<Raw[]>(
    //   `/ncr-defects/web/inspection/${inspectionId}`
    // );
    // return raw.map((item) => parseNcrDefect(item));
    return mockNcrApi.getByInspection(inspectionId);
  },

  /** `GET /ncr-defects/web/{id}` → `NcrDefectDto`. */
  async getById(id: number): Promise<NcrDefect> {
    // return parseNcrDefect(await api.get<Raw>(`/ncr-defects/web/${id}`));
    return mockNcrApi.getById(id);
  },

  /**
   * `POST /ncr-defects/web` → `NcrDefectDto`.
   *
   * Multipart when evidence is attached: the DTO rides as a JSON `data` part
   * and the files as repeated `evidence` parts, matching how issues and
   * attendance already post files in this codebase.
   */
  async create(dto: CreateNcrDefectRequest): Promise<NcrDefect> {
    // const { files, ...payload } = dto;
    // const form = new FormData();
    // form.append('data', JSON.stringify(payload));
    // for (const file of files ?? []) form.append('evidence', file);
    // return parseNcrDefect(
    //   await api.postMultipart<Raw>('/ncr-defects/web', form)
    // );
    return mockNcrApi.create(dto);
  },

  /** `PATCH /ncr-defects/web/{id}` → `NcrDefectDto`. */
  async update(id: number, dto: UpdateNcrDefectRequest): Promise<NcrDefect> {
    // return parseNcrDefect(await api.patch<Raw>(`/ncr-defects/web/${id}`, dto));
    return mockNcrApi.update(id, dto);
  },

  /** `GET /ncr-defects/web/{id}/comments` → `NcrCommentDto[]`. */
  async getComments(id: number): Promise<NcrComment[]> {
    // const raw = await api.get<Raw[]>(`/ncr-defects/web/${id}/comments`);
    // return raw.map((item) => parseNcrComment(item));
    return mockNcrApi.getComments(id);
  },

  /**
   * `POST /ncr-defects/web/{id}/comments` → `NcrCommentDto`.
   * Carries an optional status transition so a progress update is one call.
   */
  async addComment(
    id: number,
    dto: CreateNcrCommentRequest
  ): Promise<NcrComment> {
    // const { files, ...payload } = dto;
    // const form = new FormData();
    // form.append('data', JSON.stringify(payload));
    // for (const file of files ?? []) form.append('attachments', file);
    // return parseNcrComment(
    //   await api.postMultipart<Raw>(`/ncr-defects/web/${id}/comments`, form)
    // );
    return mockNcrApi.addComment(id, dto);
  },

  /** `POST /ncr-defects/web/{id}/evidence` → `NcrDefectDto`. */
  async addEvidence(id: number, files: File[]): Promise<NcrDefect> {
    // const form = new FormData();
    // for (const file of files) form.append('evidence', file);
    // return parseNcrDefect(
    //   await api.postMultipart<Raw>(`/ncr-defects/web/${id}/evidence`, form)
    // );
    return mockNcrApi.addEvidence(id, files);
  },
};
