export enum InspectionStatus {
  scheduled = 'scheduled',
  inProgress = 'in-progress',
  completed = 'completed',
  failed = 'failed',
  passed = 'passed',
  passedWithRemarks = 'passed-with-remarks',
  cancelled = 'cancelled',
}

export enum InspectionType {
  safety = 'safety',
  quality = 'quality',
  progress = 'progress',
  final = 'final',
  structural = 'structural',
  electrical = 'electrical',
  plumbing = 'plumbing',
  finishing = 'finishing',
  compliance = 'compliance',
}

export enum InspectionResult {
  passed = 'passed',
  failed = 'failed',
  passedWithRemarks = 'passed-with-remarks',
  pending = 'pending',
}

export enum CheckItemStatus {
  passed = 'passed',
  failed = 'failed',
  notApplicable = 'not-applicable',
  pending = 'pending',
}

export const inspectionStatusLabels: Record<InspectionStatus, string> = {
  scheduled: 'Scheduled',
  'in-progress': 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
  passed: 'Passed',
  'passed-with-remarks': 'Passed with Remarks',
  cancelled: 'Cancelled',
};

export const inspectionTypeLabels: Record<InspectionType, string> = {
  safety: 'Safety Inspection',
  quality: 'Quality Inspection',
  progress: 'Progress Inspection',
  final: 'Final Inspection',
  structural: 'Structural Inspection',
  electrical: 'Electrical Inspection',
  plumbing: 'Plumbing Inspection',
  finishing: 'Finishing Inspection',
  compliance: 'Compliance Inspection',
};

export const inspectionResultLabels: Record<InspectionResult, string> = {
  passed: 'Passed',
  failed: 'Failed',
  'passed-with-remarks': 'Passed with Remarks',
  pending: 'Pending',
};

export const checkItemStatusLabels: Record<CheckItemStatus, string> = {
  passed: 'Passed',
  failed: 'Failed',
  'not-applicable': 'N/A',
  pending: 'Pending',
};

export function calculateCompliance(
  totalCheckPoints: number,
  passedCheckPoints: number
): number {
  if (totalCheckPoints === 0) return 0;
  return Math.round((passedCheckPoints / totalCheckPoints) * 100);
}

export function determineInspectionResult(
  compliancePercentage: number,
  criticalDefects: number
): InspectionResult {
  if (criticalDefects > 0) return InspectionResult.failed;
  if (compliancePercentage >= 95) return InspectionResult.passed;
  if (compliancePercentage >= 80) return InspectionResult.passedWithRemarks;
  return InspectionResult.failed;
}
