import {
  RISK_IMPACTS,
  RISK_PROBABILITIES,
  RISK_RESPONSE_TYPES,
  RISK_STATUSES,
  type RiskRequest,
} from '@tornotron/echno-core/risk/types';
import { isRiskCategory } from '@/types/risk';

/**
 * Risks this browser held before the register moved to the server.
 *
 * Until October 2026 the Risk Register kept each project's risks in the
 * browser's local storage under `echno-risks-{projectId}`, so nobody else saw
 * them. The register now lives on the server; what a browser still holds is
 * offered for import once, and the local copy is removed after it lands.
 */

const LEGACY_CATEGORIES = new Set([
  'schedule',
  'cost',
  'scope',
  'safety',
  'technical',
  'external',
  'resource',
]);

export function localRiskStorageKey(projectId: number): string {
  return `echno-risks-${projectId}`;
}

/** The raw entries stored for a project, or an empty list when there are none or they cannot be read. */
export function readLocalRisks(projectId: number): unknown[] {
  if (globalThis.window === undefined) return [];
  try {
    const raw = globalThis.localStorage.getItem(localRiskStorageKey(projectId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Drops the local copy once it has been imported or discarded. */
export function clearLocalRisks(projectId: number): void {
  try {
    globalThis.localStorage.removeItem(localRiskStorageKey(projectId));
  } catch {
    // Storage blocked: nothing to clear.
  }
}

function text(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function oneOf<T extends string>(
  values: readonly T[],
  value: unknown,
  fallback: T
): T {
  return values.includes(value as T) ? (value as T) : fallback;
}

function isoDate(value: unknown): string | undefined {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : undefined;
}

function nonNegative(value: unknown, integer: boolean): number | undefined {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return undefined;
  return integer ? Math.min(Math.round(n), 36_500) : Math.round(n * 100) / 100;
}

function localNumber(entry: Record<string, unknown>): number {
  const n = Number(String(entry.riskId ?? '').replace(/^R-/, ''));
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

/**
 * Turns the stored entries into import lines, in their R-number order. Every
 * field is checked against what the server accepts, so one odd entry is
 * repaired rather than failing the whole import: an unknown code falls back
 * to the form's default, a malformed date or a negative amount is dropped.
 * The entry's own id travels as `importRef`, so importing twice adds nothing.
 */
export function toImportRequests(entries: unknown[]): RiskRequest[] {
  return entries
    .filter(
      (entry): entry is Record<string, unknown> =>
        !!entry && typeof entry === 'object'
    )
    .toSorted((a, b) => localNumber(a) - localNumber(b))
    .map((entry) => {
      const category = typeof entry.category === 'string' ? entry.category : '';
      return {
        title: text(entry.title, 255) ?? 'Untitled risk',
        description: text(entry.description, 4000),
        category:
          isRiskCategory(category) || LEGACY_CATEGORIES.has(category)
            ? category
            : 'schedule-planning',
        subCategory: text(entry.subCategory, 255),
        status: oneOf(RISK_STATUSES, entry.status, 'identified'),
        owner: text(entry.owner, 255),
        probability: oneOf(RISK_PROBABILITIES, entry.probability, 'medium'),
        impact: oneOf(RISK_IMPACTS, entry.impact, 'moderate'),
        residualProbability: oneOf(
          RISK_PROBABILITIES,
          entry.residualProbability,
          'low'
        ),
        residualImpact: oneOf(RISK_IMPACTS, entry.residualImpact, 'minor'),
        responseType: oneOf(
          RISK_RESPONSE_TYPES,
          entry.responseType,
          'mitigate'
        ),
        contingencyPlan: text(entry.contingencyPlan, 4000),
        identifiedDate: isoDate(entry.identifiedDate),
        reviewDate: isoDate(entry.reviewDate),
        closedDate: isoDate(entry.closedDate),
        costImpact: nonNegative(entry.costImpact, false),
        scheduleImpact: nonNegative(entry.scheduleImpact, true),
        importRef: text(entry.id, 64),
      };
    });
}
