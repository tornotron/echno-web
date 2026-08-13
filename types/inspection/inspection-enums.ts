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
} from '@tornotron/echno-core/inspection/types';

export {
  InspectionStatus,
  InspectionType,
  InspectionResult,
  CheckItemStatus,
} from '@tornotron/echno-core/inspection/types';

export const inspectionStatusLabels: Record<InspectionStatus, string> = {
  [InspectionStatus.SCHEDULED]: 'Scheduled',
  [InspectionStatus.IN_PROGRESS]: 'In Progress',
  [InspectionStatus.COMPLETED]: 'Completed',
  [InspectionStatus.FAILED]: 'Failed',
  [InspectionStatus.PASSED]: 'Passed',
  [InspectionStatus.PASSED_WITH_REMARKS]: 'Passed with Remarks',
  [InspectionStatus.CANCELLED]: 'Cancelled',
};

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
