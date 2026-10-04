import type {
  BillLineStatus,
  BillStatus,
  BillingModel,
  RequirementStatus,
} from '@tornotron/echno-core/contract-billing/types';
import { cn } from '@/lib/utils/index';
import {
  LINE_STATUS_CLASSES,
  LINE_STATUS_LABELS,
  MODEL_LABELS,
  REQUIREMENT_STATUS_CLASSES,
  REQUIREMENT_STATUS_LABELS,
  STATUS_CLASSES,
  STATUS_LABELS,
} from '../lib/labels';

const CHIP =
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap';

export function BillStatusChip({ status }: { status: BillStatus }) {
  return (
    <span className={cn(CHIP, STATUS_CLASSES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ModelChip({ model }: { model?: BillingModel }) {
  if (!model) {
    return (
      <span
        className={cn(
          CHIP,
          'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
        )}
      >
        Not started
      </span>
    );
  }
  return (
    <span
      className={cn(
        CHIP,
        'border border-zinc-300 bg-white text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200'
      )}
    >
      {MODEL_LABELS[model]}
    </span>
  );
}

export function LineStatusChip({ status }: { status: BillLineStatus }) {
  return (
    <span className={cn(CHIP, LINE_STATUS_CLASSES[status])}>
      {LINE_STATUS_LABELS[status]}
    </span>
  );
}

export function RequirementStatusChip({
  status,
}: {
  status: RequirementStatus;
}) {
  return (
    <span className={cn(CHIP, REQUIREMENT_STATUS_CLASSES[status])}>
      {REQUIREMENT_STATUS_LABELS[status]}
    </span>
  );
}

/** The native select used across the billing dialogs, styled like the inputs. */
export const SELECT_CLASS =
  'border-input bg-background h-9 w-full rounded-md border px-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none';
