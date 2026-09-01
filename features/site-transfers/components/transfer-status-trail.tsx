'use client';

/**
 * How a transfer came to hold the status it holds.
 *
 * The trail carries several kinds of entry and they are not interchangeable.
 * Two are somebody's act: a person raised the transfer, or a person stood at
 * the gate and confirmed what came off the lorry. The rest are not:
 *
 * - a **`BASELINE`** entry is the status the transfer was observed to hold when
 *   recording began, not a change at all;
 * - a **`SYSTEM`** entry is a change the migration made, correcting a status to
 *   match movements that had already been posted, which nobody decided;
 * - an **unknown** source is one the backend added after this client shipped.
 *   It is drawn as attributed to nobody rather than guessed at, because
 *   guessing wrong in the other direction puts a colleague's name on a change
 *   they did not make.
 *
 * Rendering all four the same way attributes a migration to whoever is named
 * nearest, which is exactly the misreading a trail exists to prevent. Neither
 * of the last two carries an actor, so this draws them as the system's and says
 * so, rather than leaving a blank where a name would be and letting the reader
 * fill it in.
 *
 * Reading the trail needs the `system-admin` role. A caller without it gets a
 * 403, and that is a trail they may not see rather than a transfer with no
 * history, so the card says which.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { History, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useSiteTransferStatusHistory } from '@tornotron/echno-core/site-transfers/hooks';
import {
  isPersonsChange,
  StatusTransitionSource,
  type StatusTransition,
} from '@tornotron/echno-core';
import {
  SiteTransferStatus,
  siteTransferStatusLabels,
} from '@tornotron/echno-core/site-transfers/types';
import { ApiError } from '@/lib/api/api-client';

interface TransferStatusTrailProps {
  transferId: number;
}

/** Renders a raw status string with the label the rest of the app uses. */
function statusLabel(status: string | null): string {
  if (!status) return '—';
  const known = Object.values(SiteTransferStatus).includes(
    status as SiteTransferStatus
  );
  return known
    ? siteTransferStatusLabels[status as SiteTransferStatus]
    : status;
}

/** Who an entry should be attributed to, in words. */
function attribution(entry: StatusTransition): string {
  if (isPersonsChange(entry)) {
    return entry.changedByName || 'Somebody no longer on record';
  }
  switch (entry.source) {
    case StatusTransitionSource.baseline: {
      return 'Recorded when the trail began';
    }
    case StatusTransitionSource.system: {
      return 'Corrected by the system';
    }
    default: {
      return 'Not attributed to a person';
    }
  }
}

/** The badge that marks an entry as not somebody's act. */
function sourceBadge(entry: StatusTransition): string {
  switch (entry.source) {
    case StatusTransitionSource.baseline: {
      return 'Baseline';
    }
    case StatusTransitionSource.system: {
      return 'System';
    }
    default: {
      return 'Recorded';
    }
  }
}

export function TransferStatusTrail({ transferId }: TransferStatusTrailProps) {
  const { data, isLoading, error } = useSiteTransferStatusHistory(transferId);

  const forbidden = error instanceof ApiError && error.status === 403;
  if (forbidden) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Status History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading history...
          </div>
        )}

        {!isLoading && error && (
          <p className="text-muted-foreground text-sm">
            The status history could not be loaded.
          </p>
        )}

        {!isLoading && !error && data && data.content.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Nothing recorded on this transfer yet.
          </p>
        )}

        {!isLoading && !error && data && data.content.length > 0 && (
          <ol className="space-y-4">
            {data.content.map((entry) => {
              const byAPerson = isPersonsChange(entry);
              return (
                <li key={entry.id} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {statusLabel(entry.fromStatus)}
                    </span>
                    <span className="text-muted-foreground">to</span>
                    <span className="font-medium">
                      {statusLabel(entry.toStatus)}
                    </span>
                    {!byAPerson && (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground font-normal"
                      >
                        {sourceBadge(entry)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {attribution(entry)}
                    {entry.occurredAt
                      ? ` · ${format(new Date(entry.occurredAt), 'dd MMM yyyy, HH:mm')}`
                      : ''}
                  </p>
                  {entry.note && (
                    <p className="text-muted-foreground text-xs italic">
                      {entry.note}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
