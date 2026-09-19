import { ToolboxTalkStatus } from '@tornotron/echno-core/toolbox-talks/types';

export const toolboxTalkStatusLabels: Record<ToolboxTalkStatus, string> = {
  [ToolboxTalkStatus.DRAFT]: 'Draft',
  [ToolboxTalkStatus.RECORDED]: 'Recorded',
};

/** Today's date as the `YYYY-MM-DD` the backend and `<input type="date">` share. */
export function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** `HH:mm` from an input into the backend's `HH:mm:ss`; empty stays absent. */
export function toTalkTime(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

/** The backend's `HH:mm:ss` back into what a time input holds. */
export function fromTalkTime(value: string | undefined): string {
  return value ? value.slice(0, 5) : '';
}
