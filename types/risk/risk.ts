// types/risk/risk.ts
//
// Presentation for the risk register: labels, descriptions, score colours.
// The register itself (the Risk record, its request and the vocabularies) is
// kept on the server and typed in echno-core.

import type {
  RiskImpact,
  RiskProbability,
  RiskResponseType,
  RiskStatus,
} from '@tornotron/echno-core/risk/types';

export type {
  Risk,
  RiskImpact,
  RiskProbability,
  RiskRequest,
  RiskResponseType,
  RiskStatus,
} from '@tornotron/echno-core/risk/types';

/**
 * The construction risk categories the product team supplied (ClickUp 86d4609hd), in the order of
 * that list.
 */
export type RiskCategory =
  | 'design-engineering'
  | 'contractual-legal'
  | 'financial-commercial'
  | 'procurement-supply-chain'
  | 'construction-execution'
  | 'site-ground-conditions'
  | 'health-safety-security'
  | 'environmental'
  | 'quality'
  | 'resource-manpower'
  | 'plant-equipment'
  | 'schedule-planning'
  | 'client-stakeholder'
  | 'statutory-regulatory'
  | 'external-force-majeure'
  | 'subcontractor'
  | 'technology-data-information'
  | 'commissioning-handover'
  | 'reputational-business';

/**
 * Categories from the first, generic list. Risks recorded before the construction list replaced it
 * still carry one of these, so they keep a readable label; new risks cannot pick them.
 * ('quality' is in both lists and lives in {@link RiskCategory}.)
 */
export type LegacyRiskCategory =
  | 'schedule'
  | 'cost'
  | 'scope'
  | 'safety'
  | 'technical'
  | 'external'
  | 'resource';
export const PROBABILITY_SCORE: Record<RiskProbability, number> = {
  'very-low': 1,
  low: 2,
  medium: 3,
  high: 4,
  'very-high': 5,
};

export const IMPACT_SCORE: Record<RiskImpact, number> = {
  negligible: 1,
  minor: 2,
  moderate: 3,
  major: 4,
  catastrophic: 5,
};

export const PROBABILITY_LABELS: Record<RiskProbability, string> = {
  'very-low': 'Very Low',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  'very-high': 'Very High',
};

export const IMPACT_LABELS: Record<RiskImpact, string> = {
  negligible: 'Negligible',
  minor: 'Minor',
  moderate: 'Moderate',
  major: 'Major',
  catastrophic: 'Catastrophic',
};

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  'design-engineering': 'Design & Engineering',
  'contractual-legal': 'Contractual & Legal',
  'financial-commercial': 'Financial & Commercial',
  'procurement-supply-chain': 'Procurement & Supply Chain',
  'construction-execution': 'Construction & Execution',
  'site-ground-conditions': 'Site & Ground Conditions',
  'health-safety-security': 'Health, Safety & Security',
  environmental: 'Environmental',
  quality: 'Quality',
  'resource-manpower': 'Resource & Manpower',
  'plant-equipment': 'Plant & Equipment',
  'schedule-planning': 'Schedule & Planning',
  'client-stakeholder': 'Client & Stakeholder',
  'statutory-regulatory': 'Statutory & Regulatory',
  'external-force-majeure': 'External & Force Majeure',
  subcontractor: 'Subcontractor',
  'technology-data-information': 'Technology, Data & Information',
  'commissioning-handover': 'Commissioning & Handover',
  'reputational-business': 'Reputational & Business',
};

export const RISK_CATEGORY_DESCRIPTIONS: Record<RiskCategory, string> = {
  'design-engineering':
    'Risks arising from the adequacy, completeness, timeliness, and change of design and engineering deliverables.',
  'contractual-legal':
    'Risks arising from contract terms, obligations, claims, disputes, and legal exposure between the parties.',
  'financial-commercial':
    'Risks affecting project funding, cash flow, budgets, pricing, and overall commercial viability.',
  'procurement-supply-chain':
    'Risks relating to sourcing, ordering, delivery, and availability of materials, equipment, and services.',
  'construction-execution':
    'Risks arising during physical execution of works including methods, productivity, sequencing, and temporary works.',
  'site-ground-conditions':
    'Risks arising from the physical condition, access, and surroundings of the site including subsurface conditions.',
  'health-safety-security':
    'Risks of injury, illness, loss of life, and loss or damage of assets due to unsafe acts, conditions, or security failures.',
  environmental:
    'Risks of environmental damage, nuisance to surroundings, and non-compliance with environmental obligations.',
  quality:
    'Risks of work or materials failing to meet specified standards, resulting in rejection, rework, or defect liability.',
  'resource-manpower':
    'Risks relating to availability, competency, retention, and industrial relations of manpower and key staff.',
  'plant-equipment':
    'Risks relating to availability, reliability, certification, and utilization of construction plant and equipment.',
  'schedule-planning':
    'Risks affecting the project programme, critical path, milestones, and the accuracy of planning and progress control.',
  'client-stakeholder':
    'Risks arising from client decisions, consultant actions, and the interests of third parties and the surrounding community.',
  'statutory-regulatory':
    'Risks arising from permits, approvals, changes in law, and compliance with authority requirements.',
  'external-force-majeure':
    'Risks from events outside the control of the parties including weather, natural events, and civil disruption.',
  subcontractor:
    'Risks arising from the performance, solvency, compliance, and scope interfaces of subcontractors and specialist agencies.',
  'technology-data-information':
    'Risks relating to project information, document control, digital systems, and data security.',
  'commissioning-handover':
    'Risks arising during testing, commissioning, documentation, and transfer of the completed works to the client.',
  'reputational-business':
    "Risks affecting the company's standing, prequalification status, client relationships, and future order book.",
};

const LEGACY_RISK_CATEGORY_LABELS: Record<LegacyRiskCategory, string> = {
  schedule: 'Schedule',
  cost: 'Cost',
  scope: 'Scope',
  safety: 'Safety',
  technical: 'Technical',
  external: 'External',
  resource: 'Resource',
};

export const RISK_CATEGORIES = Object.keys(
  RISK_CATEGORY_LABELS
) as RiskCategory[];

export function isRiskCategory(value: string): value is RiskCategory {
  return Object.hasOwn(RISK_CATEGORY_LABELS, value);
}

/** The label for a stored category, including one from the earlier generic list. */
export function riskCategoryLabel(category: string): string {
  if (isRiskCategory(category)) return RISK_CATEGORY_LABELS[category];
  return (
    (LEGACY_RISK_CATEGORY_LABELS as Record<string, string>)[category] ??
    category
  );
}

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  identified: 'Identified',
  analysed: 'Analysed',
  'response-planned': 'Response Planned',
  mitigated: 'Mitigated',
  closed: 'Closed',
  occurred: 'Occurred',
};

export const RISK_RESPONSE_LABELS: Record<RiskResponseType, string> = {
  avoid: 'Avoid',
  mitigate: 'Mitigate',
  transfer: 'Transfer',
  accept: 'Accept',
};

export function calcRiskScore(
  probability: RiskProbability,
  impact: RiskImpact
): number {
  return PROBABILITY_SCORE[probability] * IMPACT_SCORE[impact];
}

/** Returns a Tailwind bg color class based on risk score (1–25) */
export function getRiskScoreBadgeClass(score: number): string {
  if (score <= 4)
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (score <= 9)
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  if (score <= 16)
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
}

export function getRiskScoreLabel(score: number): string {
  if (score <= 4) return 'Low';
  if (score <= 9) return 'Medium';
  if (score <= 16) return 'High';
  return 'Critical';
}
