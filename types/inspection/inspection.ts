import { parsePositiveInt } from '@/types/parse-id';
import {
  InspectionStatus,
  InspectionType,
  InspectionResult,
} from './inspection-enums';
import {
  InspectionCheckItem,
  parseInspectionCheckItem,
} from './inspection-check-item';
import { InspectionDefect, parseInspectionDefect } from './inspection-defect';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any;

export interface Inspection {
  id: number;
  inspectionNumber: string;
  title: string;
  type: InspectionType;
  status: InspectionStatus;
  result?: InspectionResult;

  projectId?: number;
  projectName?: string;
  location: string;
  areaInspected: string;
  drawingReference?: string;

  scheduledDate: Date;
  scheduledTime?: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  duration?: number;

  inspectorId: number;
  inspectorName?: string;
  contractorId?: number;
  contractorName?: string;
  clientRepresentative?: string;
  attendees?: string[];

  checkItems: InspectionCheckItem[];
  defects: InspectionDefect[];

  weatherConditions?: string;
  temperature?: string;

  totalCheckPoints: number;
  passedCheckPoints: number;
  failedCheckPoints: number;
  defectsFound: number;
  criticalDefects: number;
  majorDefects: number;
  minorDefects: number;

  compliancePercentage: number;

  observationsAndComments?: string;
  recommendations?: string;
  correctiveActions?: string;
  nextInspectionDate?: Date;

  attachments?: string[];
  photos?: string[];

  inspectorSignature?: string;
  inspectorSignedAt?: Date;
  contractorSignature?: string;
  contractorSignedAt?: Date;
  clientSignature?: string;
  clientSignedAt?: Date;

  reinspectionRequired: boolean;
  reinspectionDate?: Date;
  reinspectionNotes?: string;

  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  approvedBy?: number;
  approvedAt?: Date;
}

export function parseInspection(raw: Raw): Inspection {
  return {
    id: parsePositiveInt(raw.id, 'parseInspection.id'),
    inspectionNumber: raw.inspectionNumber,
    title: raw.title,
    type: raw.type as InspectionType,
    status: raw.status as InspectionStatus,
    result: raw.result as InspectionResult | undefined,

    projectId: raw.projectId ?? undefined,
    projectName: raw.projectName ?? undefined,
    location: raw.location,
    areaInspected: raw.areaInspected,
    drawingReference: raw.drawingReference ?? undefined,

    scheduledDate: new Date(raw.scheduledDate),
    scheduledTime: raw.scheduledTime ?? undefined,
    actualStartTime: raw.actualStartTime
      ? new Date(raw.actualStartTime)
      : undefined,
    actualEndTime: raw.actualEndTime ? new Date(raw.actualEndTime) : undefined,
    duration: raw.duration ?? undefined,

    inspectorId: parsePositiveInt(
      raw.inspectorId,
      'parseInspection.inspectorId'
    ),
    inspectorName: raw.inspectorName ?? undefined,
    contractorId: raw.contractorId ?? undefined,
    contractorName: raw.contractorName ?? undefined,
    clientRepresentative: raw.clientRepresentative ?? undefined,
    attendees: raw.attendees ?? undefined,

    checkItems: Array.isArray(raw.checkItems)
      ? (raw.checkItems as Raw[]).map((item) => parseInspectionCheckItem(item))
      : [],
    defects: Array.isArray(raw.defects)
      ? (raw.defects as Raw[]).map((d) => parseInspectionDefect(d))
      : [],

    weatherConditions: raw.weatherConditions ?? undefined,
    temperature: raw.temperature ?? undefined,

    totalCheckPoints: raw.totalCheckPoints ?? 0,
    passedCheckPoints: raw.passedCheckPoints ?? 0,
    failedCheckPoints: raw.failedCheckPoints ?? 0,
    defectsFound: raw.defectsFound ?? 0,
    criticalDefects: raw.criticalDefects ?? 0,
    majorDefects: raw.majorDefects ?? 0,
    minorDefects: raw.minorDefects ?? 0,

    compliancePercentage: raw.compliancePercentage ?? 0,

    observationsAndComments: raw.observationsAndComments ?? undefined,
    recommendations: raw.recommendations ?? undefined,
    correctiveActions: raw.correctiveActions ?? undefined,
    nextInspectionDate: raw.nextInspectionDate
      ? new Date(raw.nextInspectionDate)
      : undefined,

    attachments: raw.attachments ?? undefined,
    photos: raw.photos ?? undefined,

    inspectorSignature: raw.inspectorSignature ?? undefined,
    inspectorSignedAt: raw.inspectorSignedAt
      ? new Date(raw.inspectorSignedAt)
      : undefined,
    contractorSignature: raw.contractorSignature ?? undefined,
    contractorSignedAt: raw.contractorSignedAt
      ? new Date(raw.contractorSignedAt)
      : undefined,
    clientSignature: raw.clientSignature ?? undefined,
    clientSignedAt: raw.clientSignedAt
      ? new Date(raw.clientSignedAt)
      : undefined,

    reinspectionRequired: raw.reinspectionRequired ?? false,
    reinspectionDate: raw.reinspectionDate
      ? new Date(raw.reinspectionDate)
      : undefined,
    reinspectionNotes: raw.reinspectionNotes ?? undefined,

    createdBy: parsePositiveInt(raw.createdBy, 'parseInspection.createdBy'),
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    completedAt: raw.completedAt ? new Date(raw.completedAt) : undefined,
    approvedBy: raw.approvedBy ?? undefined,
    approvedAt: raw.approvedAt ? new Date(raw.approvedAt) : undefined,
  };
}
