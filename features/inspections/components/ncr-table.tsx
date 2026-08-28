'use client';

import { useState } from 'react';
import { Paperclip, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/shadcn/card';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { useResponsibleName } from '@/hooks/inspection';
import type { NcrDefect } from '@/types/inspection';
import {
  NcrDueDate,
  NcrOverdueBadge,
  NcrSeverityBadge,
  NcrStatusBadge,
} from './inspection-badges';
import { NcrDetailSheet } from './ncr-detail-sheet';

interface NcrTableProps {
  defects: NcrDefect[];
  isLoading?: boolean;
}

/**
 * NCR list.
 *
 * Rows are read-only: status moves happen in the detail sheet, where the
 * transition is recorded together with the comment and evidence explaining it.
 * A bare "Advance" control here would have changed status with no such record.
 */
export function NcrTable({ defects, isLoading = false }: NcrTableProps) {
  const [triaged, setTriaged] = useState<NcrDefect | undefined>();
  const responsibleName = useResponsibleName();

  if (isLoading) {
    return (
      <Card variant="panel" className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (defects.length === 0) {
    return (
      <Card variant="panel" className="p-8">
        <Empty>
          <EmptyMedia variant="icon">
            <ShieldAlert />
          </EmptyMedia>
          <EmptyTitle>No NCRs or defects</EmptyTitle>
          <EmptyDescription>
            Nothing matches the current filters. NCRs raised from a failed
            checklist item appear here automatically.
          </EmptyDescription>
        </Empty>
      </Card>
    );
  }

  return (
    <>
      {/* ── Mobile (<md) ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:hidden">
        {defects.map((defect) => (
          <NcrCard
            key={defect.id}
            defect={defect}
            responsibleName={responsibleName(defect)}
            onOpen={() => setTriaged(defect)}
          />
        ))}
      </div>

      {/* ── Desktop (md+) ────────────────────────────────────────────────── */}
      <Card variant="panel" className="hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NCR</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsible</TableHead>
                <TableHead>Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {defects.map((defect) => (
                <TableRow
                  key={defect.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => setTriaged(defect)}
                >
                  <TableCell>
                    {/*
                      The row handles pointer clicks, but the title stays a
                      real button so the sheet is reachable by keyboard.
                    */}
                    <button
                      type="button"
                      className="focus-visible:ring-ring rounded text-left focus-visible:ring-2 focus-visible:outline-none"
                      onClick={() => setTriaged(defect)}
                    >
                      <span className="font-medium">{defect.title}</span>
                      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        {defect.ncrNumber}
                        {defect.checklistElementLabel &&
                          ` · ${defect.checklistElementLabel}`}
                        {defect.evidence.length > 0 && (
                          <span className="inline-flex items-center gap-0.5">
                            <Paperclip className="size-3" />
                            {defect.evidence.length}
                          </span>
                        )}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {defect.projectName ?? `#${defect.projectId}`}
                  </TableCell>
                  <TableCell>
                    <NcrSeverityBadge severity={defect.severity} />
                  </TableCell>
                  <TableCell>
                    <NcrStatusBadge status={defect.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {responsibleName(defect) ?? 'Unassigned'}
                  </TableCell>
                  <TableCell>
                    <NcrDueDate defect={defect} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <NcrDetailSheet
        defect={triaged}
        onOpenChange={(open) => !open && setTriaged(undefined)}
      />
    </>
  );
}

/**
 * One NCR as a stacked card.
 *
 * Six columns do not fit a phone, and triaging defects is exactly the job that
 * happens away from a desk — so below `md` the row becomes a card that opens
 * the same detail sheet the table rows do.
 */
function NcrCard({
  defect,
  responsibleName,
  onOpen,
}: {
  defect: NcrDefect;
  responsibleName?: string;
  onOpen: () => void;
}) {
  return (
    <Card className="gap-0 p-0 transition-shadow active:opacity-80">
      <button
        type="button"
        onClick={onOpen}
        className="focus-visible:ring-ring flex flex-col gap-3 p-4 text-left focus-visible:ring-2 focus-visible:outline-none"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm leading-snug font-medium">{defect.title}</p>
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              {defect.ncrNumber}
              {defect.evidence.length > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <Paperclip className="size-3" />
                  {defect.evidence.length}
                </span>
              )}
            </p>
          </div>
          <NcrStatusBadge status={defect.status} />
        </div>

        {defect.checklistElementLabel && (
          <p className="text-muted-foreground truncate text-xs">
            {defect.checklistElementLabel}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <NcrSeverityBadge severity={defect.severity} />
          <NcrOverdueBadge defect={defect} />
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
          <span className="min-w-0 truncate">
            {defect.projectName ?? `#${defect.projectId}`}
          </span>
          <span className="truncate">{responsibleName ?? 'Unassigned'}</span>
        </div>

        {/* Labelled here, unlike the table, where the column header says it. */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-muted-foreground text-xs">Due</span>
          <NcrDueDate defect={defect} />
        </div>
      </button>
    </Card>
  );
}
