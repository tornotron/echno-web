'use client';

import { useState } from 'react';

/**
 * Local edit state for one record, with a dirty flag reported to the parent
 * as edits happen. Reporting from the update path rather than an effect
 * keeps the parent in step without a render-then-sync round trip.
 */
export function useDraft<T>(
  initial: () => T,
  onDirtyChange: (dirty: boolean) => void
) {
  const [baseline, setBaseline] = useState(initial);
  const [draft, setDraft] = useState(baseline);
  const isDirty = (next: T, base: T = baseline) =>
    JSON.stringify(next) !== JSON.stringify(base);

  const update = (fn: (d: T) => T) => {
    const next = fn(draft);
    setDraft(next);
    onDirtyChange(isDirty(next));
  };

  const reset = () => {
    setDraft(baseline);
    onDirtyChange(false);
  };

  /** Marks the current draft as saved. */
  const commit = (saved: T = draft) => {
    setBaseline(saved);
    setDraft(saved);
    onDirtyChange(false);
  };

  return { draft, update, reset, commit, dirty: isDirty(draft) };
}
