import { ApiError } from '@/lib/api/api-client';
import { mockInspections } from '@/components/shared/mock-data';
import type { Inspection } from '@/types/inspection';
import type {
  CreateInspectionRequest,
  UpdateInspectionRequest,
} from '@/types/inspection';

// TODO: Replace mock data with real API calls once the inspection backend is available.
//   getAll:  api.get<Raw[]>('/inspections/web')
//   getById: api.get<Raw>(`/inspections/web/${id}`)
//   create:  api.post<Raw>('/inspections', createInspectionToJson(dto))
//   update:  api.patch<Raw>(`/inspections/${id}`, updateInspectionToJson(dto))
export const inspectionService = {
  async getAll(): Promise<Inspection[]> {
    return mockInspections;
  },

  async getById(id: number): Promise<Inspection> {
    const item = mockInspections.find((i) => i.id === id);
    if (!item) throw new ApiError(`Inspection ${id} not found.`, 404);
    return item;
  },

  async create(dto: CreateInspectionRequest): Promise<Inspection> {
    const now = new Date();
    const newInspection: Inspection = {
      id: Date.now(),
      inspectionNumber: `INS-${now.getFullYear()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
      title: dto.title,
      type: dto.type,
      status: 'scheduled' as Inspection['status'],
      projectId: dto.projectId,
      location: dto.location,
      areaInspected: dto.areaInspected,
      drawingReference: dto.drawingReference,
      scheduledDate: new Date(dto.scheduledDate),
      scheduledTime: dto.scheduledTime,
      inspectorId: dto.inspectorId,
      contractorId: dto.contractorId,
      clientRepresentative: dto.clientRepresentative,
      checkItems: [],
      defects: [],
      weatherConditions: dto.weatherConditions,
      temperature: dto.temperature,
      totalCheckPoints: 0,
      passedCheckPoints: 0,
      failedCheckPoints: 0,
      defectsFound: 0,
      criticalDefects: 0,
      majorDefects: 0,
      minorDefects: 0,
      compliancePercentage: 0,
      observationsAndComments: dto.observationsAndComments,
      recommendations: dto.recommendations,
      reinspectionRequired: false,
      createdBy: 1,
      createdAt: now,
      updatedAt: now,
    };
    return newInspection;
  },

  async update(id: number, dto: UpdateInspectionRequest): Promise<Inspection> {
    const item = mockInspections.find((i) => i.id === id);
    if (!item) throw new ApiError(`Inspection ${id} not found.`, 404);
    const updated: Inspection = {
      ...item,
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.result !== undefined && { result: dto.result }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.areaInspected !== undefined && {
        areaInspected: dto.areaInspected,
      }),
      ...(dto.drawingReference !== undefined && {
        drawingReference: dto.drawingReference,
      }),
      ...(dto.scheduledDate !== undefined && {
        scheduledDate: new Date(dto.scheduledDate),
      }),
      ...(dto.scheduledTime !== undefined && {
        scheduledTime: dto.scheduledTime,
      }),
      ...(dto.inspectorId !== undefined && { inspectorId: dto.inspectorId }),
      ...(dto.contractorId !== undefined && { contractorId: dto.contractorId }),
      ...(dto.clientRepresentative !== undefined && {
        clientRepresentative: dto.clientRepresentative,
      }),
      ...(dto.weatherConditions !== undefined && {
        weatherConditions: dto.weatherConditions,
      }),
      ...(dto.temperature !== undefined && { temperature: dto.temperature }),
      ...(dto.observationsAndComments !== undefined && {
        observationsAndComments: dto.observationsAndComments,
      }),
      ...(dto.recommendations !== undefined && {
        recommendations: dto.recommendations,
      }),
      ...(dto.correctiveActions !== undefined && {
        correctiveActions: dto.correctiveActions,
      }),
      ...(dto.nextInspectionDate !== undefined && {
        nextInspectionDate: new Date(dto.nextInspectionDate),
      }),
      ...(dto.reinspectionRequired !== undefined && {
        reinspectionRequired: dto.reinspectionRequired,
      }),
      ...(dto.reinspectionDate !== undefined && {
        reinspectionDate: new Date(dto.reinspectionDate),
      }),
      ...(dto.reinspectionNotes !== undefined && {
        reinspectionNotes: dto.reinspectionNotes,
      }),
      updatedAt: new Date(),
    };
    return updated;
  },
};
