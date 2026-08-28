'use client';

/**
 * Compact NCR list for the inspection's side column.
 *
 * The full {@link NcrTable} is six columns wide and cannot sit in a sidebar,
 * so this trades the columns for a stacked row and defers the detail to the
 * same triage sheet the NCR page uses.
 */

import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/shadcn/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useNcrsByInspection } from '@/hooks/inspection';
import type { Ncr } from '@/types/inspection';
import {
  NcrOverdueBadge,
  NcrSeverityBadge,
  NcrStatusBadge,
} from './inspection-badges';
import { NcrDetailSheet } from './ncr-detail-sheet';

interface LinkedNcrListProps {
  /** The inspection whose NCRs are listed. */
  inspectionId: string;
}

export function LinkedNcrList({ inspectionId }: LinkedNcrListProps) {
  const { data: ncrs = [], isLoading } = useNcrsByInspection(inspectionId);
  const [triaged, setTriaged] = useState<Ncr | undefined>();

  return (
    <>
      <Card variant="panel">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold">NCRs Raised</h3>
            <p className="text-muted-foreground text-xs">
              From this inspection
            </p>
          </div>
          {ncrs.length > 0 && <Badge variant="secondary">{ncrs.length}</Badge>}
        </div>

        {isLoading ? (
          <div className="space-y-2 px-5 pb-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : ncrs.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-1.5 px-5 pb-5 text-center">
            <ShieldAlert className="size-5" />
            <p className="text-xs">
              None yet. Raise one from a check point that failed.
            </p>
          </div>
        ) : (
          <>
            <Separator />
            <ul className="divide-border divide-y">
              {ncrs.map((ncr) => (
                <li key={ncr.id}>
                  <button
                    type="button"
                    onClick={() => setTriaged(ncr)}
                    className="hover:bg-muted/50 w-full space-y-1.5 px-5 py-3 text-left transition-colors"
                  >
                    <p className="truncate text-sm font-medium">{ncr.title}</p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <NcrStatusBadge status={ncr.status} />
                      <NcrSeverityBadge severity={ncr.severity} />
                      <NcrOverdueBadge ncr={ncr} />
                    </div>

                    <p className="text-muted-foreground truncate text-xs">
                      {ncr.ncrNumber}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <NcrDetailSheet
        ncr={triaged}
        onOpenChange={(open) => !open && setTriaged(undefined)}
      />
    </>
  );
}
