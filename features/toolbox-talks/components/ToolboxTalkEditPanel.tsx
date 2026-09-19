'use client';

import { getErrorMessage } from '@tornotron/echno-core';
import { ToolboxTalkStatus } from '@tornotron/echno-core/toolbox-talks/types';
import type { ToolboxTalk } from '@tornotron/echno-core/toolbox-talks/types';
import { Skeleton } from '@/components/shadcn/skeleton';
import { ToolboxTalksForm } from './ToolboxTalksForm';

interface ToolboxTalkEditPanelProps {
  talk: ToolboxTalk | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onSaved: (talk: ToolboxTalk) => void;
  onCancel: () => void;
}

/**
 * The edit page's body: the loading skeleton, the fetch error, the
 * recorded-talk notice, and the draft form. Kept out of the route so
 * `app/.../[id]/edit/page.tsx` stays a thin data-fetch wrapper.
 */
export function ToolboxTalkEditPanel({
  talk,
  isPending,
  isError,
  error,
  onSaved,
  onCancel,
}: ToolboxTalkEditPanelProps) {
  if (isPending) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {getErrorMessage(error)}
      </p>
    );
  }
  if (!talk) {
    return null;
  }
  if (talk.status !== ToolboxTalkStatus.DRAFT) {
    return (
      <p className="text-muted-foreground text-sm">
        This talk has been recorded and no longer changes.
      </p>
    );
  }
  return (
    <ToolboxTalksForm talk={talk} onSaved={onSaved} onCancel={onCancel} />
  );
}
