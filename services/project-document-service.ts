import type { Inspection, ProjectDocument } from '@/types/inspection';
import { mockProjectDocumentApi } from './inspection-mock';

// TODO: Backend not built yet — every method is served by `inspection-mock.ts`.
//   See the note in inspection-service.ts for the cut-over steps.

// import { api } from '@/lib/api/api-client';
// import { parseInspection, parseProjectDocument } from '@/types/inspection';
//
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// type Raw = any;

/**
 * The project's existing document library, and the link between those files
 * and an inspection.
 *
 * Attaching never copies bytes — an inspection stores references, so the
 * project library remains the single source of truth for drawings and specs.
 */
export const projectDocumentService = {
  /** `GET /projects/web/{projectId}/documents` → `AttachmentDto[]`. */
  async getByProject(projectId: number): Promise<ProjectDocument[]> {
    // const raw = await api.get<Raw[]>(
    //   `/projects/web/${projectId}/documents`
    // );
    // return raw.map((item) => parseProjectDocument(item));
    return mockProjectDocumentApi.getByProject(projectId);
  },

  /** `POST /inspections/web/{id}/documents` → `InspectionDto`. */
  async attachToInspection(
    inspectionId: number,
    documentIds: number[]
  ): Promise<Inspection> {
    // return parseInspection(
    //   await api.post<Raw>(`/inspections/web/${inspectionId}/documents`, {
    //     documentIds,
    //   })
    // );
    return mockProjectDocumentApi.attachToInspection(inspectionId, documentIds);
  },

  /** `DELETE /inspections/web/{id}/documents/{documentId}` → `InspectionDto`. */
  async detachFromInspection(
    inspectionId: number,
    documentId: number
  ): Promise<Inspection> {
    // return parseInspection(
    //   await api.delete<Raw>(
    //     `/inspections/web/${inspectionId}/documents/${documentId}`
    //   )
    // );
    return mockProjectDocumentApi.detachFromInspection(
      inspectionId,
      documentId
    );
  },
};
