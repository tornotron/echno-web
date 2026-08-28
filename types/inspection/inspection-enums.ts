/**
 * Inspection domain enums.
 *
 * Values are SCREAMING_SNAKE_CASE and travel over the wire verbatim — the
 * backend persists them with `@Enumerated(EnumType.STRING)`, so no case
 * translation happens in the service layer.
 */

// ---------------------------------------------------------------------------
// Inspection
// ---------------------------------------------------------------------------

export enum InspectionType {
  qaQc = 'QA_QC',
  safety = 'SAFETY',
  ncrDefect = 'NCR_DEFECT',
}

export enum InspectionStatus {
  draft = 'DRAFT',
  scheduled = 'SCHEDULED',
  inProgress = 'IN_PROGRESS',
  completed = 'COMPLETED',
  cancelled = 'CANCELLED',
}

export enum InspectionResult {
  pending = 'PENDING',
  passed = 'PASSED',
  passedWithRemarks = 'PASSED_WITH_REMARKS',
  failed = 'FAILED',
}

export const inspectionTypeLabels: Record<InspectionType, string> = {
  [InspectionType.qaQc]: 'QA/QC',
  [InspectionType.safety]: 'Safety',
  [InspectionType.ncrDefect]: 'NCR / Defect',
};

export const inspectionStatusLabels: Record<InspectionStatus, string> = {
  [InspectionStatus.draft]: 'Draft',
  [InspectionStatus.scheduled]: 'Scheduled',
  [InspectionStatus.inProgress]: 'In Progress',
  [InspectionStatus.completed]: 'Completed',
  [InspectionStatus.cancelled]: 'Cancelled',
};

export const inspectionResultLabels: Record<InspectionResult, string> = {
  [InspectionResult.pending]: 'Pending',
  [InspectionResult.passed]: 'Passed',
  [InspectionResult.passedWithRemarks]: 'Passed with Remarks',
  [InspectionResult.failed]: 'Failed',
};

// ---------------------------------------------------------------------------
// NCR / Defect
// ---------------------------------------------------------------------------

/** NCR lifecycle. Ordered — index doubles as progress through the workflow. */
export enum NcrStatus {
  open = 'OPEN',
  assigned = 'ASSIGNED',
  underCorrection = 'UNDER_CORRECTION',
  submittedForVerification = 'SUBMITTED_FOR_VERIFICATION',
  verified = 'VERIFIED',
  closed = 'CLOSED',
}

export const NCR_STATUS_FLOW: NcrStatus[] = [
  NcrStatus.open,
  NcrStatus.assigned,
  NcrStatus.underCorrection,
  NcrStatus.submittedForVerification,
  NcrStatus.verified,
  NcrStatus.closed,
];

export const ncrStatusLabels: Record<NcrStatus, string> = {
  [NcrStatus.open]: 'Open',
  [NcrStatus.assigned]: 'Assigned',
  [NcrStatus.underCorrection]: 'Under Correction',
  [NcrStatus.submittedForVerification]: 'Submitted for Verification',
  [NcrStatus.verified]: 'Verified',
  [NcrStatus.closed]: 'Closed',
};

/** The status an NCR may legally move to next. Empty once closed. */
export function nextNcrStatuses(current: NcrStatus): NcrStatus[] {
  const index = NCR_STATUS_FLOW.indexOf(current);
  if (index === -1 || index === NCR_STATUS_FLOW.length - 1) return [];
  return [NCR_STATUS_FLOW[index + 1]];
}

export enum NcrSeverity {
  low = 'LOW',
  medium = 'MEDIUM',
  high = 'HIGH',
  critical = 'CRITICAL',
}

export const ncrSeverityLabels: Record<NcrSeverity, string> = {
  [NcrSeverity.low]: 'Low',
  [NcrSeverity.medium]: 'Medium',
  [NcrSeverity.high]: 'High',
  [NcrSeverity.critical]: 'Critical',
};

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export enum TemplateCategory {
  qaQc = 'QA_QC',
  safety = 'SAFETY',
  ncrDefect = 'NCR_DEFECT',
  general = 'GENERAL',
}

export const templateCategoryLabels: Record<TemplateCategory, string> = {
  [TemplateCategory.qaQc]: 'QA/QC',
  [TemplateCategory.safety]: 'Safety',
  [TemplateCategory.ncrDefect]: 'NCR / Defects',
  [TemplateCategory.general]: 'General',
};

export enum SubmissionStatus {
  draft = 'DRAFT',
  submitted = 'SUBMITTED',
}

// ---------------------------------------------------------------------------
// Badge variant mapping
// ---------------------------------------------------------------------------

/**
 * Maps domain status to the app's existing Badge variants so inspection
 * chips read the same as every other module's.
 */
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export const inspectionStatusVariants: Record<InspectionStatus, BadgeVariant> =
  {
    [InspectionStatus.draft]: 'outline',
    [InspectionStatus.scheduled]: 'secondary',
    [InspectionStatus.inProgress]: 'default',
    [InspectionStatus.completed]: 'secondary',
    [InspectionStatus.cancelled]: 'outline',
  };

export const inspectionResultVariants: Record<InspectionResult, BadgeVariant> =
  {
    [InspectionResult.pending]: 'outline',
    [InspectionResult.passed]: 'secondary',
    [InspectionResult.passedWithRemarks]: 'secondary',
    [InspectionResult.failed]: 'destructive',
  };

export const ncrStatusVariants: Record<NcrStatus, BadgeVariant> = {
  [NcrStatus.open]: 'destructive',
  [NcrStatus.assigned]: 'default',
  [NcrStatus.underCorrection]: 'default',
  [NcrStatus.submittedForVerification]: 'secondary',
  [NcrStatus.verified]: 'secondary',
  [NcrStatus.closed]: 'outline',
};

export const ncrSeverityVariants: Record<NcrSeverity, BadgeVariant> = {
  [NcrSeverity.low]: 'outline',
  [NcrSeverity.medium]: 'secondary',
  [NcrSeverity.high]: 'default',
  [NcrSeverity.critical]: 'destructive',
};

/** Compliance thresholds shared by the runtime scorer and the reports. */
export function resultFromCompliance(
  compliancePercentage: number,
  criticalDefects: number
): InspectionResult {
  if (criticalDefects > 0) return InspectionResult.failed;
  if (compliancePercentage >= 95) return InspectionResult.passed;
  if (compliancePercentage >= 80) return InspectionResult.passedWithRemarks;
  return InspectionResult.failed;
}
