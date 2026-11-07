import {
  ProjectBillingState,
  type ProjectBillingSummary,
} from '@tornotron/echno-core/contract-billing/types';

export const PROJECT_STATE_LABELS: Record<ProjectBillingState, string> = {
  [ProjectBillingState.NO_CONTRACTS]: 'No contracts',
  [ProjectBillingState.NOT_STARTED]: 'Not started',
  [ProjectBillingState.IN_PROGRESS]: 'In progress',
  [ProjectBillingState.PAYMENT_DUE]: 'Payment due',
  [ProjectBillingState.SETTLED]: 'Settled',
};

/** Tailwind classes for a project's billing state chip. */
export const PROJECT_STATE_CLASSES: Record<ProjectBillingState, string> = {
  [ProjectBillingState.NO_CONTRACTS]:
    'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  [ProjectBillingState.NOT_STARTED]:
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  [ProjectBillingState.IN_PROGRESS]:
    'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  [ProjectBillingState.PAYMENT_DUE]:
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  [ProjectBillingState.SETTLED]:
    'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
};

/** The same states as ring and legend colours. Each is also named in the legend. */
export const PROJECT_STATE_STROKES: Record<ProjectBillingState, string> = {
  [ProjectBillingState.NO_CONTRACTS]: 'stroke-zinc-300 dark:stroke-zinc-600',
  [ProjectBillingState.NOT_STARTED]: 'stroke-slate-400 dark:stroke-slate-500',
  [ProjectBillingState.IN_PROGRESS]: 'stroke-blue-500 dark:stroke-blue-400',
  [ProjectBillingState.PAYMENT_DUE]: 'stroke-amber-500 dark:stroke-amber-400',
  [ProjectBillingState.SETTLED]: 'stroke-green-500 dark:stroke-green-400',
};

/** Order of the states in the status summary: what needs attention first. */
const STATE_ORDER: ProjectBillingState[] = [
  ProjectBillingState.PAYMENT_DUE,
  ProjectBillingState.IN_PROGRESS,
  ProjectBillingState.SETTLED,
  ProjectBillingState.NOT_STARTED,
  ProjectBillingState.NO_CONTRACTS,
];

export interface ProjectStateCount {
  state: ProjectBillingState;
  count: number;
}

/** How many of the given projects are in each state, states with none left out. */
export function projectStateCounts(
  rows: Pick<ProjectBillingSummary, 'billingState'>[]
): ProjectStateCount[] {
  return STATE_ORDER.map((state) => ({
    state,
    count: rows.filter((row) => row.billingState === state).length,
  })).filter(({ count }) => count > 0);
}

/** City and state, whichever the project has; empty when it has neither. */
export function projectLocation(
  row: Pick<ProjectBillingSummary, 'city' | 'state'>
): string {
  return [row.city, row.state].filter(Boolean).join(', ');
}

export interface RingSegment extends ProjectStateCount {
  /** Length of the arc, as a share of the circumference from 0 to 1. */
  share: number;
  /** Where the arc starts, as a share of the circumference from 0 to 1. */
  offset: number;
}

/** Lays the counts out around a ring, in order, from the top. */
export function ringSegments(counts: ProjectStateCount[]): RingSegment[] {
  const total = counts.reduce((sum, { count }) => sum + count, 0);
  if (total === 0) return [];
  let offset = 0;
  return counts.map((entry) => {
    const share = entry.count / total;
    const segment = { ...entry, share, offset };
    offset += share;
    return segment;
  });
}
