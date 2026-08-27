'use client';

import { formatDistanceToNow } from 'date-fns';
import { History } from 'lucide-react';
import { Button } from '@/components/shadcn/button';

export interface FormDraftBannerProps {
  /** The offered draft, from `useFormDraft`. Null renders nothing. */
  draft: { savedAt: number } | null;
  /** Applies the draft to the form. */
  onRestore: () => void;
  /** Throws the draft away. */
  onDiscard: () => void;
  /** What the draft is of, for the sentence. Defaults to "form". */
  label?: string;
}

/**
 * Tells the user a draft of this form is waiting, and lets them take it or not.
 *
 * The restore is deliberately a decision rather than something that has already
 * happened by the time the form is drawn. A form that repopulates itself
 * silently is how someone submits values they did not type and did not read,
 * and on these forms those values are wages and vendor terms.
 */
export function FormDraftBanner({
  draft,
  onRestore,
  onDiscard,
  label = 'form',
}: FormDraftBannerProps) {
  if (!draft) return null;

  const savedAgo = formatDistanceToNow(new Date(draft.savedAt), {
    addSuffix: true,
  });

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/40"
    >
      <div className="flex items-start gap-3">
        <History className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Unsaved {label} from {savedAgo}
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-300/80">
            This was kept on this device when the page was last left. Attached
            files are not part of it.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" size="sm" onClick={onRestore}>
          Restore
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDiscard}>
          Discard
        </Button>
      </div>
    </div>
  );
}
