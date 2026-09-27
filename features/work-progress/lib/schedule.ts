import type { WbsActivity } from '@tornotron/echno-core/wbs/types';
import { WbsStatus } from '@tornotron/echno-core/wbs/types';
import { ProgressOutcome } from '@tornotron/echno-core/work-progress/types';

/**
 * Today at the sites, as `YYYY-MM-DD`. The backend judges "not in the
 * future" in IST, so the form defaults and caps the inspection date in IST
 * whatever zone the browser is in.
 */
export function todayAtSites(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** The delay badge text: on time, or how many days late. */
export function delayLabel(delayDays: number | undefined): string | undefined {
  if (delayDays === undefined) return undefined;
  if (delayDays <= 0) return 'On time';
  return delayDays === 1 ? '1 day late' : `${delayDays} days late`;
}

/**
 * Whether the inspection being recorded finds the activity behind its
 * planned finish, the same rule the backend applies: a finished activity by
 * its actual finish, an open one by the inspection date or a later forecast.
 * The server decides; this only tells the form to ask for a reason.
 */
export function isLateAt(
  plannedFinish: string | undefined,
  outcome: ProgressOutcome,
  inspectionDate: string,
  actualFinish?: string,
  forecastFinish?: string
): boolean {
  if (!plannedFinish) return false;
  if (outcome === ProgressOutcome.DONE) {
    return Boolean(actualFinish) && (actualFinish as string) > plannedFinish;
  }
  if (inspectionDate > plannedFinish) return true;
  return Boolean(forecastFinish) && (forecastFinish as string) > plannedFinish;
}

/** A progress inspection is recorded against a leaf that is still open. */
export function canTakeProgress(activity: WbsActivity): boolean {
  return (
    activity.isLeaf &&
    activity.status !== WbsStatus.COMPLETED &&
    activity.status !== WbsStatus.CANCELLED
  );
}

export interface ScheduleSummary {
  activities: number;
  completed: number;
  delayed: number;
  milestones: number;
}

/** The counts on the summary cards. Parents are rolled up, so only leaves count. */
export function summarize(activities: WbsActivity[]): ScheduleSummary {
  const leaves = activities.filter((a) => a.isLeaf);
  return {
    activities: leaves.length,
    completed: leaves.filter((a) => a.status === WbsStatus.COMPLETED).length,
    delayed: leaves.filter((a) => (a.delayDays ?? 0) > 0).length,
    milestones: leaves.filter((a) => a.isMilestone).length,
  };
}
