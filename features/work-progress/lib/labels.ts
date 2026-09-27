import { WbsDependencyType, WbsStatus } from '@tornotron/echno-core/wbs/types';
import {
  DelayReason,
  ProgressOutcome,
} from '@tornotron/echno-core/work-progress/types';

/** How each outcome reads to a site team. */
export const OUTCOME_LABELS: Record<ProgressOutcome, string> = {
  [ProgressOutcome.DONE]: 'Done',
  [ProgressOutcome.PARTIAL]: 'Partly done',
  [ProgressOutcome.NOT_DONE]: 'Not done',
};

export const DELAY_REASON_LABELS: Record<DelayReason, string> = {
  [DelayReason.WEATHER]: 'Weather',
  [DelayReason.MATERIAL]: 'Material not available',
  [DelayReason.LABOUR]: 'Labour shortage',
  [DelayReason.EQUIPMENT]: 'Equipment',
  [DelayReason.DESIGN_CHANGE]: 'Design change',
  [DelayReason.CLIENT]: 'Client',
  [DelayReason.SUBCONTRACTOR]: 'Subcontractor',
  [DelayReason.OTHER]: 'Other',
};

export const DEPENDENCY_TYPE_LABELS: Record<WbsDependencyType, string> = {
  [WbsDependencyType.FS]: 'Starts after it finishes',
  [WbsDependencyType.SS]: 'Starts when it starts',
  [WbsDependencyType.FF]: 'Finishes when it finishes',
  [WbsDependencyType.SF]: 'Finishes when it starts',
};

export const STATUS_LABELS: Record<WbsStatus, string> = {
  [WbsStatus.NOT_STARTED]: 'Not started',
  [WbsStatus.IN_PROGRESS]: 'In progress',
  [WbsStatus.COMPLETED]: 'Completed',
  [WbsStatus.ON_HOLD]: 'On hold',
  [WbsStatus.CANCELLED]: 'Cancelled',
};
