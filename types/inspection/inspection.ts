// types/inspection/inspection.ts

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

export interface InspectionCheckItem {
  id: number;
  category: string;              // e.g., "Structural", "Safety", "Quality"
  checkPoint: string;            // What to check
  specification: string;         // Expected standard/spec
  status: CheckItemStatus;
  remarks?: string;
  photosRequired: boolean;
  photos?: string[];             // URLs to photos
  measurement?: string;          // Actual measurement if applicable
  expectedValue?: string;        // Expected measurement
  priority: 'high' | 'medium' | 'low';
}

export interface InspectionDefect {
  id: number;
  category: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  location: string;
  photos?: string[];
  correctiveAction: string;
  responsibleParty?: string;
  targetDate?: Date;
  status: 'open' | 'in-progress' | 'resolved' | 'verified';
  resolvedDate?: Date;
}

export interface Inspection {
  id: number;
  inspectionNumber: string;      // e.g., "INS-2024-001"
  title: string;
  type: InspectionType;
  status: InspectionStatus;
  result?: InspectionResult;
  
  // Project & Location
  projectId?: number;
  projectName?: string;
  location: string;
  areaInspected: string;         // Specific area/zone
  drawingReference?: string;     // Related drawing number
  
  // Scheduling
  scheduledDate: Date;
  scheduledTime?: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  duration?: number;             // Minutes
  
  // Parties Involved
  inspectorId: number;           // Employee ID
  inspectorName?: string;
  contractorId?: number;
  contractorName?: string;
  clientRepresentative?: string;
  attendees?: string[];          // Names of people present
  
  // Inspection Details
  checkItems: InspectionCheckItem[];
  defects: InspectionDefect[];
  
  // Weather & Conditions (for construction)
  weatherConditions?: string;
  temperature?: string;
  
  // Results & Summary
  totalCheckPoints: number;
  passedCheckPoints: number;
  failedCheckPoints: number;
  defectsFound: number;
  criticalDefects: number;
  majorDefects: number;
  minorDefects: number;
  
  // Compliance
  compliancePercentage: number;  // Passed/Total * 100
  
  // Comments & Recommendations
  observationsAndComments?: string;
  recommendations?: string;
  correctiveActions?: string;
  nextInspectionDate?: Date;
  
  // Documents
  attachments?: string[];        // Reports, certificates, etc.
  photos?: string[];
  
  // Signatures & Approval
  inspectorSignature?: string;
  inspectorSignedAt?: Date;
  contractorSignature?: string;
  contractorSignedAt?: Date;
  clientSignature?: string;
  clientSignedAt?: Date;
  
  // Follow-up
  reinspectionRequired: boolean;
  reinspectionDate?: Date;
  reinspectionNotes?: string;
  
  // Audit
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  approvedBy?: number;
  approvedAt?: Date;
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

// Helper function to calculate compliance
export function calculateCompliance(
  totalCheckPoints: number,
  passedCheckPoints: number
): number {
  if (totalCheckPoints === 0) return 0;
  return Math.round((passedCheckPoints / totalCheckPoints) * 100);
}

// Helper function to determine result based on compliance
export function determineInspectionResult(
  compliancePercentage: number,
  criticalDefects: number
): InspectionResult {
  if (criticalDefects > 0) {
    return InspectionResult.failed;
  }
  
  if (compliancePercentage >= 95) {
    return InspectionResult.passed;
  } else if (compliancePercentage >= 80) {
    return InspectionResult.passedWithRemarks;
  } else {
    return InspectionResult.failed;
  }
}
