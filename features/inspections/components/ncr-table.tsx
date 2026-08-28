'use client';

import { useMemo, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/shadcn/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type Ncr, ncrTypeLabels } from '@/types/inspection';
import {
  NcrDueDate,
  NcrOverdueBadge,
  NcrSeverityBadge,
  NcrStatusBadge,
} from './inspection-badges';
import { NcrDetailSheet } from './ncr-detail-sheet';

interface NcrTableProps {
  ncrs: Ncr[];
  isLoading?: boolean;
}

/**
 * NCR list.
 *
 * Rows are read-only: the lifecycle moves happen in the detail sheet, where
 * the step is recorded together with the remarks explaining it. A bare
 * "Advance" control here would have moved an NCR with no such record.
 */
export function NcrTable({ ncrs, isLoading = false }: NcrTableProps) {
  const [triaged, setTriaged] = useState<Ncr | undefined>();
  const engineerName = useEngineerNames();

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

  if (ncrs.length === 0) {
    return (
      <Card variant="panel" className="p-8">
        <Empty>
          <EmptyMedia variant="icon">
            <ShieldAlert />
          </EmptyMedia>
          <EmptyTitle>No NCRs</EmptyTitle>
          <EmptyDescription>
            Nothing matches the current filters. NCRs raised against an
            inspection appear here.
          </EmptyDescription>
        </Empty>
      </Card>
    );
  }

  return (
    <>
      {/* ── Mobile (<md) ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:hidden">
        {ncrs.map((ncr) => (
          <NcrCard
            key={ncr.id}
            ncr={ncr}
            engineerName={engineerName(ncr.siteEngineerId)}
            onOpen={() => setTriaged(ncr)}
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
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Site Engineer</TableHead>
                <TableHead>Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ncrs.map((ncr) => (
                <TableRow
                  key={ncr.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => setTriaged(ncr)}
                >
                  <TableCell>
                    {/*
                      The row handles pointer clicks, but the title stays a
                      real button so the sheet is reachable by keyboard.
                    */}
                    <button
                      type="button"
                      className="focus-visible:ring-ring rounded text-left focus-visible:ring-2 focus-visible:outline-none"
                      onClick={() => setTriaged(ncr)}
                    >
                      <span className="font-medium">{ncr.title}</span>
                      <span className="text-muted-foreground block text-xs">
                        {ncr.ncrNumber}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ncrTypeLabels[ncr.type]}</Badge>
                  </TableCell>
                  <TableCell>
                    <NcrSeverityBadge severity={ncr.severity} />
                  </TableCell>
                  <TableCell>
                    <NcrStatusBadge status={ncr.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {engineerName(ncr.siteEngineerId) ?? 'Unassigned'}
                  </TableCell>
                  <TableCell>
                    <NcrDueDate ncr={ncr} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <NcrDetailSheet
        ncr={triaged}
        onOpenChange={(open) => !open && setTriaged(undefined)}
      />
    </>
  );
}

/**
 * Resolves a site engineer id to a display name.
 *
 * The NCR carries only the employee id, so the name has to come from the
 * directory. The lookup projection is used rather than the full employee list
 * because it is readable by any tenant member, and a site engineer triaging
 * NCRs will usually not hold the management role the full list requires.
 */
function useEngineerNames() {
  const { data: employees = [] } = useEmployeeLookup();

  const byId = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee.name])),
    [employees]
  );

  return (id?: number): string | undefined => {
    if (id == null) return undefined;
    // Falls back to the bare id so an engineer outside the readable directory
    // still shows as somebody rather than as unassigned.
    return byId.get(id) ?? `#${id}`;
  };
}

/**
 * One NCR as a stacked card.
 *
 * Six columns do not fit a phone, and triaging NCRs is exactly the job that
 * happens away from a desk, so below `md` the row becomes a card that opens
 * the same detail sheet the table rows do.
 */
function NcrCard({
  ncr,
  engineerName,
  onOpen,
}: {
  ncr: Ncr;
  engineerName?: string;
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
            <p className="text-sm leading-snug font-medium">{ncr.title}</p>
            <p className="text-muted-foreground text-xs">{ncr.ncrNumber}</p>
          </div>
          <NcrStatusBadge status={ncr.status} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{ncrTypeLabels[ncr.type]}</Badge>
          <NcrSeverityBadge severity={ncr.severity} />
          <NcrOverdueBadge ncr={ncr} />
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
          <span className="truncate">{engineerName ?? 'Unassigned'}</span>
        </div>

        {/* Labelled here, unlike the table, where the column header says it. */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-muted-foreground text-xs">Target</span>
          <NcrDueDate ncr={ncr} />
        </div>
      </button>
    </Card>
  );
}
