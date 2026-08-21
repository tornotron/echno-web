import { describe, expect, test } from 'bun:test';
import {
  InspectionStatus,
  InspectionOrigin,
  ComplianceRiskLevel,
  CompliancePhase,
  inspectionStatusLabels,
  inspectionOriginLabels,
  complianceRiskLevelLabels,
  complianceRiskLevelBadgeColors,
  compliancePhaseLabels,
  compliancePhaseOrder,
} from './inspection-enums';

describe('compliance enum labels', () => {
  test('every inspection status has a label, including SUGGESTED', () => {
    for (const status of Object.values(InspectionStatus)) {
      expect(inspectionStatusLabels[status]).toBeTruthy();
    }
    expect(inspectionStatusLabels[InspectionStatus.SUGGESTED]).toBe('Suggested');
  });

  test('origin labels cover both origins', () => {
    expect(inspectionOriginLabels[InspectionOrigin.MANUAL]).toBe('Manual');
    expect(inspectionOriginLabels[InspectionOrigin.AI_GENERATED]).toBe(
      'AI Generated'
    );
  });

  test('every risk level has a label and a badge colour', () => {
    for (const level of Object.values(ComplianceRiskLevel)) {
      expect(complianceRiskLevelLabels[level]).toBeTruthy();
      expect(complianceRiskLevelBadgeColors[level]).toContain('bg-');
    }
  });

  test('every phase has a label', () => {
    for (const phase of Object.values(CompliancePhase)) {
      expect(compliancePhaseLabels[phase]).toBeTruthy();
    }
  });

  test('phase order is the full lifecycle sequence', () => {
    expect(compliancePhaseOrder).toEqual([
      CompliancePhase.PRE_CONSTRUCTION,
      CompliancePhase.ONGOING,
      CompliancePhase.POST_CONSTRUCTION,
    ]);
  });
});
