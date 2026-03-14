// types/risk/risk.ts

export type RiskProbability =
  | 'very-low'
  | 'low'
  | 'medium'
  | 'high'
  | 'very-high';
export type RiskImpact =
  | 'negligible'
  | 'minor'
  | 'moderate'
  | 'major'
  | 'catastrophic';
export type RiskCategory =
  | 'schedule'
  | 'cost'
  | 'scope'
  | 'quality'
  | 'safety'
  | 'technical'
  | 'external'
  | 'resource';
export type RiskStatus =
  | 'identified'
  | 'analysed'
  | 'response-planned'
  | 'mitigated'
  | 'closed'
  | 'occurred';
export type RiskResponseType = 'avoid' | 'mitigate' | 'transfer' | 'accept';
export type RiskActionStatus = 'open' | 'in-progress' | 'completed';

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
  schedule: 'Schedule',
  cost: 'Cost',
  scope: 'Scope',
  quality: 'Quality',
  safety: 'Safety',
  technical: 'Technical',
  external: 'External',
  resource: 'Resource',
};

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

export interface RiskAction {
  id: string;
  riskId: string;
  description: string;
  owner: string;
  dueDate: string;
  status: RiskActionStatus;
}

export interface Risk {
  id: string;
  projectId: number;
  riskId: string; // user-facing: "R-001"
  title: string;
  description: string;
  category: RiskCategory;
  status: RiskStatus;
  owner: string;
  probability: RiskProbability;
  impact: RiskImpact;
  riskScore: number;
  residualProbability: RiskProbability;
  residualImpact: RiskImpact;
  residualScore: number;
  responseType: RiskResponseType;
  contingencyPlan?: string;
  identifiedDate: string;
  reviewDate: string;
  closedDate?: string;
  costImpact?: number;
  scheduleImpact?: number;
}
