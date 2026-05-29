import {
  InspectionStatus,
  InspectionResult,
  InspectionType,
} from './inspection-enums';

export interface UpdateInspectionRequest {
  title?: string;
  type?: InspectionType;
  status?: InspectionStatus;
  result?: InspectionResult;
  location?: string;
  areaInspected?: string;
  drawingReference?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  inspectorId?: number;
  contractorId?: number;
  clientRepresentative?: string;
  weatherConditions?: string;
  temperature?: string;
  observationsAndComments?: string;
  recommendations?: string;
  correctiveActions?: string;
  nextInspectionDate?: string;
  reinspectionRequired?: boolean;
  reinspectionDate?: string;
  reinspectionNotes?: string;
}

export function updateInspectionToJson(
  dto: UpdateInspectionRequest
): Record<string, unknown> {
  const json: Record<string, unknown> = {};
  if (dto.title !== undefined) json.title = dto.title;
  if (dto.type !== undefined) json.type = dto.type;
  if (dto.status !== undefined) json.status = dto.status;
  if (dto.result !== undefined) json.result = dto.result;
  if (dto.location !== undefined) json.location = dto.location;
  if (dto.areaInspected !== undefined) json.areaInspected = dto.areaInspected;
  if (dto.drawingReference !== undefined)
    json.drawingReference = dto.drawingReference;
  if (dto.scheduledDate !== undefined) json.scheduledDate = dto.scheduledDate;
  if (dto.scheduledTime !== undefined) json.scheduledTime = dto.scheduledTime;
  if (dto.actualStartTime !== undefined)
    json.actualStartTime = dto.actualStartTime;
  if (dto.actualEndTime !== undefined) json.actualEndTime = dto.actualEndTime;
  if (dto.inspectorId !== undefined) json.inspectorId = dto.inspectorId;
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
  if (dto.correctiveActions !== undefined)
    json.correctiveActions = dto.correctiveActions;
  if (dto.nextInspectionDate !== undefined)
    json.nextInspectionDate = dto.nextInspectionDate;
  if (dto.reinspectionRequired !== undefined)
    json.reinspectionRequired = dto.reinspectionRequired;
  if (dto.reinspectionDate !== undefined)
    json.reinspectionDate = dto.reinspectionDate;
  if (dto.reinspectionNotes !== undefined)
    json.reinspectionNotes = dto.reinspectionNotes;
  return json;
}
