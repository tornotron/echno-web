import type { Subscription } from '@tornotron/echno-core/billing/types';

/** The plan an organization drops to when a trial with no payment behind it ends. */
export const FREE_PLAN_CODE = 'FREE';

export interface EndedTrial {
  organizationId: number | null;
  /** When the trial ended, as the backend sent it. */
  trialEnd: string;
  /** The plan the trial was on, for the notice's wording. */
  planName: string;
}

function isEndedManualTrial(row: Subscription, now: Date): boolean {
  return (
    row.provider === 'NONE' &&
    row.trialEnd !== null &&
    new Date(row.trialEnd).getTime() <= now.getTime() &&
    (row.status === 'EXPIRED' || row.status === 'TRIALING')
  );
}

/**
 * The manual trial the organization has just come off, when it has come off
 * one and not moved to a paid plan since: the current row is the Free plan
 * (or there is none yet, between the trial end and the backend's next pass),
 * and the row before it is a trial with no payment provider that has ended.
 * `history` is newest first, as the backend orders it.
 */
export function endedTrialNotice(
  current: Subscription | null,
  history: readonly Subscription[],
  now: Date = new Date()
): EndedTrial | null {
  if (current && current.plan?.code !== FREE_PLAN_CODE) return null;
  const previous = history.find((row) => row.id !== current?.id);
  if (!previous || !isEndedManualTrial(previous, now)) return null;
  return {
    organizationId: previous.organizationId,
    trialEnd: previous.trialEnd as string,
    planName: previous.plan?.name ?? 'trial',
  };
}

/** Where a dismissal is remembered: one per organization and per trial, so a later trial asks again. */
export function trialNoticeStorageKey(trial: EndedTrial): string {
  return `echno.trial-ended-notice.${trial.organizationId ?? 'org'}.${trial.trialEnd}`;
}
