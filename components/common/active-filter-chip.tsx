'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils/index';

export interface ActiveFilterChipProps {
  /** Label describing what the filter is on, e.g. "Submitted by". */
  label: string;
  /** The filtered value shown after the label, e.g. the employee's name. */
  name: string;
  /** Called when the dismiss (✕) button is clicked. */
  onDismiss: () => void;
  className?: string;
}

/**
 * A small dismissible pill showing an active list filter as
 * "&lt;Label&gt;: &lt;Name&gt; ✕". Clicking the ✕ invokes `onDismiss`.
 */
export function ActiveFilterChip({
  label,
  name,
  onDismiss,
  className,
}: ActiveFilterChipProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300',
        className
      )}
    >
      <span>
        <span className="font-medium">{label}:</span> {name}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Clear filter"
        className="rounded-full p-0.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
