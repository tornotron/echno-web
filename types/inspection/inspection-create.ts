import { InspectionType } from './inspection-enums';

export interface CreateInspectionRequest {
  title: string;
  type: InspectionType;
  projectId?: number;
  location: string;
  areaInspected: string;
  drawingReference?: string;
  scheduledDate: string;
  scheduledTime?: string;
  inspectorId: number;
  contractorId?: number;
  clientRepresentative?: string;
  weatherConditions?: string;
  temperature?: string;
  observationsAndComments?: string;
  recommendations?: string;
}

export function createInspectionToJson(
  dto: CreateInspectionRequest
): Record<string, unknown> {
  const json: Record<string, unknown> = {
    title: dto.title,
    type: dto.type,
    location: dto.location,
    areaInspected: dto.areaInspected,
    scheduledDate: dto.scheduledDate,
    inspectorId: dto.inspectorId,
  };
  if (dto.projectId !== undefined) json.projectId = dto.projectId;
  if (dto.drawingReference !== undefined)
    json.drawingReference = dto.drawingReference;
  if (dto.scheduledTime !== undefined) json.scheduledTime = dto.scheduledTime;
  if (dto.contractorId !== undefined) json.contractorId = dto.contractorId;
  if (dto.clientRepresentative !== undefined)
    json.clientRepresentative = dto.clientRepresentative;
  if (dto.weatherConditions !== undefined)
    json.weatherConditions = dto.weatherConditions;
  if (dto.temperature !== undefined) json.temperature = dto.temperature;
  if (dto.observationsAndComments !== undefined)
    json.observationsAndComments = dto.observationsAndComments;
  if (dto.recommendations !== undefined)
    json.recommendations = dto.recommendations;
  return json;
}
