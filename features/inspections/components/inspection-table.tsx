'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ClipboardList } from 'lucide-react';
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
import { routes } from '@/nav';
import type { Inspection } from '@/types/inspection';
import {
  InspectionResultBadge,
  InspectionStatusBadge,
  InspectionTypeBadge,
} from './inspection-badges';

interface InspectionTableProps {
  inspections: Inspection[];
  isLoading?: boolean;
  /** Hidden on the QA/QC and Safety pages, where every row shares a type. */
  showType?: boolean;
  emptyMessage?: string;
}

export function InspectionTable({
  inspections,
  isLoading = false,
  showType = true,
  emptyMessage = 'No inspections match the current filters.',
}: InspectionTableProps) {
  if (isLoading) return <TableSkeleton />;

  if (inspections.length === 0) {
    return (
      <Card variant="panel" className="p-8">
        <Empty>
          <EmptyMedia variant="icon">
            <ClipboardList />
          </EmptyMedia>
          <EmptyTitle>No inspections</EmptyTitle>
          <EmptyDescription>{emptyMessage}</EmptyDescription>
        </Empty>
      </Card>
    );
  }

  return (
    <>
      {/* ── Mobile (<md) ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:hidden">
        {inspections.map((inspection) => (
          <InspectionCard
            key={inspection.id}
            inspection={inspection}
            showType={showType}
          />
        ))}
      </div>

      {/* ── Desktop (md+) ────────────────────────────────────────────────── */}
      <Card variant="panel" className="hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inspection</TableHead>
                <TableHead>Project</TableHead>
                {showType && <TableHead>Type</TableHead>}
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
                <TableHead className="text-right">Compliance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map((inspection) => (
                <TableRow key={inspection.id}>
                  <TableCell>
                    <Link
                      href={routes.inspections.detail(inspection.id).href}
                      className="hover:underline"
                    >
                      <span className="font-medium">{inspection.title}</span>
                      {inspection.inspectionNumber && (
                        <span className="text-muted-foreground block text-xs">
                          {inspection.inspectionNumber}
                        </span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {inspection.projectName ?? `#${inspection.projectId}`}
                  </TableCell>
                  {showType && (
                    <TableCell>
                      <InspectionTypeBadge type={inspection.type} />
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {format(inspection.inspectionDate, 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <InspectionStatusBadge status={inspection.status} />
                  </TableCell>
                  <TableCell>
                    <InspectionResultBadge result={inspection.result} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {inspection.compliancePercentage}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}

/**
 * One inspection as a stacked card.
 *
 * A seven-column table on a phone is a horizontal scroll, and this list is read
 * on site far more often than at a desk — so below `md` the row becomes a card
 * that fits the screen it is actually held in.
 */
function InspectionCard({
  inspection,
  showType,
}: {
  inspection: Inspection;
  showType: boolean;
}) {
  return (
    <Card className="gap-0 p-0 transition-shadow active:opacity-80">
      <Link
        href={routes.inspections.detail(inspection.id).href}
        className="flex flex-col gap-3 p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm leading-snug font-medium">
              {inspection.title}
            </p>
            {inspection.inspectionNumber && (
              <p className="text-muted-foreground text-xs">
                {inspection.inspectionNumber}
              </p>
            )}
          </div>
          <InspectionStatusBadge status={inspection.status} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {showType && <InspectionTypeBadge type={inspection.type} />}
          <InspectionResultBadge result={inspection.result} />
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="min-w-0 truncate">
            {inspection.projectName ?? `#${inspection.projectId}`}
          </span>
          <span>{format(inspection.inspectionDate, 'dd MMM yyyy')}</span>
          <span className="ml-auto tabular-nums">
            {inspection.compliancePercentage}% compliance
          </span>
        </div>
      </Link>
    </Card>
  );
}

function TableSkeleton() {
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
