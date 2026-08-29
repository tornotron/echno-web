// types/inspection/inspection-enums.ts
//
// Web-side presentation helpers for inspection enums. The enums themselves are
// owned by @tornotron/echno-core; this module re-exports them so the app has a
// single import point, and adds the label maps used by the inspection list and
// detail views.

import {
  InspectionStatus,
  InspectionType,
  InspectionResult,
  CheckItemStatus,
  InspectionOrigin,
  ComplianceRiskLevel,
  CompliancePhase,
  NcrStatus,
  DefectSeverity,
} from '@tornotron/echno-core/inspection/types';

export {
  InspectionStatus,
  InspectionType,
  InspectionResult,
  CheckItemStatus,
  InspectionOrigin,
  ComplianceRiskLevel,
  CompliancePhase,
  // The category/trade axis and the NCR and defect enums, all owned by core
  // since v2.1.0. Their plain label maps live there too, alongside
  // `siteTransferStatusLabels` and the rest, so only the badge variants below
  // are still web's business.
  InspectionCategory,
  InspectionTrade,
  NcrType,
  NcrStatus,
  DefectSeverity,
  DefectStatus,
  inspectionCategoryLabels,
  inspectionTradeLabels,
  inspectionTradeOrder,
  ncrTypeLabels,
  ncrStatusLabels,
  defectSeverityLabels,
  defectStatusLabels,
  defaultInspectionCategoryFor,
  parseInspectionCategory,
  parseInspectionTrade,
} from '@tornotron/echno-core/inspection/types';

export const inspectionStatusLabels: Record<InspectionStatus, string> = {
  [InspectionStatus.SCHEDULED]: 'Scheduled',
  [InspectionStatus.IN_PROGRESS]: 'In Progress',
  [InspectionStatus.COMPLETED]: 'Completed',
  [InspectionStatus.FAILED]: 'Failed',
  [InspectionStatus.PASSED]: 'Passed',
  [InspectionStatus.PASSED_WITH_REMARKS]: 'Passed with Remarks',
  [InspectionStatus.CANCELLED]: 'Cancelled',
  [InspectionStatus.SUGGESTED]: 'Suggested',
};

// How an inspection came to exist. Compliance inspections produced by the AI
// generation flow are AI_GENERATED; everything else is MANUAL.
export const inspectionOriginLabels: Record<InspectionOrigin, string> = {
  [InspectionOrigin.MANUAL]: 'Manual',
  [InspectionOrigin.AI_GENERATED]: 'AI Generated',
};

// Risk severity attached to a compliance-type inspection.
export const complianceRiskLevelLabels: Record<ComplianceRiskLevel, string> = {
  [ComplianceRiskLevel.LOW]: 'Low',
  [ComplianceRiskLevel.MEDIUM]: 'Medium',
  [ComplianceRiskLevel.HIGH]: 'High',
  [ComplianceRiskLevel.CRITICAL]: 'Critical',
};

// Badge colours for the compliance risk level, low (green) through critical
// (red), matching the palette used by the inspection status/result badges.
export const complianceRiskLevelBadgeColors: Record<ComplianceRiskLevel, string> =
  {
    [ComplianceRiskLevel.LOW]:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    [ComplianceRiskLevel.MEDIUM]:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    [ComplianceRiskLevel.HIGH]:
      'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    [ComplianceRiskLevel.CRITICAL]:
      'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };

// Construction-lifecycle phase a compliance applies to.
export const compliancePhaseLabels: Record<CompliancePhase, string> = {
  [CompliancePhase.PRE_CONSTRUCTION]: 'Pre-construction',
  [CompliancePhase.ONGOING]: 'Ongoing',
  [CompliancePhase.POST_CONSTRUCTION]: 'Post-construction',
};

// Phases in lifecycle order, used to group compliances into sections.
export const compliancePhaseOrder: CompliancePhase[] = [
  CompliancePhase.PRE_CONSTRUCTION,
  CompliancePhase.ONGOING,
  CompliancePhase.POST_CONSTRUCTION,
];

export const inspectionTypeLabels: Record<InspectionType, string> = {
  [InspectionType.SAFETY]: 'Safety Inspection',
  [InspectionType.QUALITY]: 'Quality Inspection',
  [InspectionType.PROGRESS]: 'Progress Inspection',
  [InspectionType.FINAL]: 'Final Inspection',
  [InspectionType.STRUCTURAL]: 'Structural Inspection',
  [InspectionType.ELECTRICAL]: 'Electrical Inspection',
  [InspectionType.PLUMBING]: 'Plumbing Inspection',
  [InspectionType.FINISHING]: 'Finishing Inspection',
  [InspectionType.COMPLIANCE]: 'Compliance Inspection',
};

export const inspectionResultLabels: Record<InspectionResult, string> = {
  [InspectionResult.PASSED]: 'Passed',
  [InspectionResult.FAILED]: 'Failed',
  [InspectionResult.PASSED_WITH_REMARKS]: 'Passed with Remarks',
  [InspectionResult.PENDING]: 'Pending',
};

export const checkItemStatusLabels: Record<CheckItemStatus, string> = {
  [CheckItemStatus.PASSED]: 'Passed',
  [CheckItemStatus.FAILED]: 'Failed',
  [CheckItemStatus.NOT_APPLICABLE]: 'N/A',
  [CheckItemStatus.PENDING]: 'Pending',
};

// Badge variants, so inspection chips read the same as every other module's.
// The label maps above say what a value is called; these say how it looks.
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export const inspectionStatusVariants: Record<InspectionStatus, BadgeVariant> =
  {
    [InspectionStatus.SCHEDULED]: 'secondary',
    [InspectionStatus.IN_PROGRESS]: 'default',
    [InspectionStatus.COMPLETED]: 'secondary',
    [InspectionStatus.FAILED]: 'destructive',
    [InspectionStatus.PASSED]: 'secondary',
    [InspectionStatus.PASSED_WITH_REMARKS]: 'secondary',
    [InspectionStatus.CANCELLED]: 'outline',
    [InspectionStatus.SUGGESTED]: 'outline',
  };

export const inspectionResultVariants: Record<InspectionResult, BadgeVariant> =
  {
    [InspectionResult.PASSED]: 'secondary',
    [InspectionResult.FAILED]: 'destructive',
    [InspectionResult.PASSED_WITH_REMARKS]: 'secondary',
    [InspectionResult.PENDING]: 'outline',
  };

export const checkItemStatusVariants: Record<CheckItemStatus, BadgeVariant> = {
  [CheckItemStatus.PASSED]: 'secondary',
  [CheckItemStatus.FAILED]: 'destructive',
  [CheckItemStatus.NOT_APPLICABLE]: 'outline',
  [CheckItemStatus.PENDING]: 'outline',
};

// An NCR is a problem until it is signed off, so the open end of the lifecycle
// reads as destructive and the settled end fades to outline.
export const ncrStatusVariants: Record<NcrStatus, BadgeVariant> = {
  [NcrStatus.OPEN]: 'destructive',
  [NcrStatus.ASSIGNED]: 'default',
  [NcrStatus.CORRECTIVE_ACTION_COMPLETE]: 'secondary',
  [NcrStatus.VERIFIED]: 'secondary',
  [NcrStatus.CLOSED]: 'outline',
  [NcrStatus.REJECTED]: 'destructive',
  [NcrStatus.REOPENED]: 'destructive',
};

export const defectSeverityVariants: Record<DefectSeverity, BadgeVariant> = {
  [DefectSeverity.CRITICAL]: 'destructive',
  [DefectSeverity.MAJOR]: 'default',
  [DefectSeverity.MINOR]: 'outline',
};

/**
 * Compliance thresholds shared by the inspection runtime and the reports, so
 * a percentage means the same thing wherever it is shown. A critical defect
 * fails the inspection outright regardless of the score.
 */
export function resultFromCompliance(
  compliancePercentage: number,
  criticalDefects: number
): InspectionResult {
  if (criticalDefects > 0) return InspectionResult.FAILED;
  if (compliancePercentage >= 95) return InspectionResult.PASSED;
  if (compliancePercentage >= 80) return InspectionResult.PASSED_WITH_REMARKS;
  return InspectionResult.FAILED;
}

/**
 * Share of check points that passed, ignoring those marked not applicable.
 *
 * Counting an N/A item as a failure would punish an inspector for a check
 * that never applied to the work in front of them.
 */
export function compliancePercentage(inspection: {
  totalCheckPoints: number;
  passedCheckPoints: number;
  failedCheckPoints: number;
}): number {
  const assessed =
    inspection.passedCheckPoints + inspection.failedCheckPoints;
  if (assessed <= 0) return 0;
  return Math.round((inspection.passedCheckPoints / assessed) * 100);
}
