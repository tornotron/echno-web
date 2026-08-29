import { describe, expect, test } from 'bun:test';
import {
  InspectionStatus,
  InspectionOrigin,
  ComplianceRiskLevel,
  CompliancePhase,
  NcrStatus,
  DefectSeverity,
  InspectionCategory,
  InspectionTrade,
  inspectionStatusLabels,
  inspectionOriginLabels,
  complianceRiskLevelLabels,
  complianceRiskLevelBadgeColors,
  compliancePhaseLabels,
  compliancePhaseOrder,
  inspectionCategoryLabels,
  inspectionTradeLabels,
  ncrStatusLabels,
  ncrStatusVariants,
  defectSeverityLabels,
  defectSeverityVariants,
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

/**
 * The enums and their plain labels come from core; what is still web's to get
 * right is that every value has a badge to render in. A variant map that has
 * fallen behind core shows an undefined variant rather than failing loudly,
 * so it is worth pinning here.
 */
describe('badge variants cover the core enums', () => {
  test('every NCR status has a label and a badge variant', () => {
    for (const status of Object.values(NcrStatus)) {
      expect(ncrStatusLabels[status]).toBeTruthy();
      expect(ncrStatusVariants[status]).toBeTruthy();
    }
  });

  test('every defect severity has a label and a badge variant', () => {
    for (const severity of Object.values(DefectSeverity)) {
      expect(defectSeverityLabels[severity]).toBeTruthy();
      expect(defectSeverityVariants[severity]).toBeTruthy();
    }
  });

  test('every category and trade carries a label', () => {
    for (const category of Object.values(InspectionCategory)) {
      expect(inspectionCategoryLabels[category]).toBeTruthy();
    }
    for (const trade of Object.values(InspectionTrade)) {
      expect(inspectionTradeLabels[trade]).toBeTruthy();
    }
  });
});
