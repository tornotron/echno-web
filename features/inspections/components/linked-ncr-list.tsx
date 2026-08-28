'use client';

/**
 * Compact NCR list for the inspection's side column.
 *
 * The full {@link NcrTable} is seven columns wide and cannot sit in a sidebar,
 * so this trades the columns for a stacked row and defers the detail to the
 * same triage sheet the NCR page uses.
 */

import { useState } from 'react';
import { Paperclip, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/shadcn/badge';
import { Card } from '@/components/shadcn/card';
import { Separator } from '@/components/shadcn/separator';
import type { NcrDefect } from '@/types/inspection';
import {
  NcrOverdueBadge,
  NcrSeverityBadge,
  NcrStatusBadge,
} from './inspection-badges';
import { NcrDetailSheet } from './ncr-detail-sheet';

interface LinkedNcrListProps {
  defects: NcrDefect[];
}

export function LinkedNcrList({ defects }: LinkedNcrListProps) {
  const [triaged, setTriaged] = useState<NcrDefect | undefined>();

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
          {defects.length > 0 && (
            <Badge variant="secondary">{defects.length}</Badge>
          )}
        </div>

        {defects.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-1.5 px-5 pb-5 text-center">
            <ShieldAlert className="size-5" />
            <p className="text-xs">
              None yet. Answering an item Fail or No offers to raise one.
            </p>
          </div>
        ) : (
          <>
            <Separator />
            <ul className="divide-border divide-y">
              {defects.map((defect) => (
                <li key={defect.id}>
                  <button
                    type="button"
                    onClick={() => setTriaged(defect)}
                    className="hover:bg-muted/50 w-full space-y-1.5 px-5 py-3 text-left transition-colors"
                  >
                    <p className="truncate text-sm font-medium">
                      {defect.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <NcrStatusBadge status={defect.status} />
                      <NcrSeverityBadge severity={defect.severity} />
                      <NcrOverdueBadge defect={defect} />
                      {defect.evidence.length > 0 && (
                        <span className="text-muted-foreground inline-flex items-center gap-0.5 text-xs">
                          <Paperclip className="size-3" />
                          {defect.evidence.length}
                        </span>
                      )}
                    </div>

                    {defect.checklistElementLabel && (
                      <p className="text-muted-foreground truncate text-xs">
                        {defect.checklistElementLabel}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <NcrDetailSheet
        defect={triaged}
        onOpenChange={(open) => !open && setTriaged(undefined)}
      />
    </>
  );
}
