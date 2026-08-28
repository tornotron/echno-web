'use client';

/**
 * Status chips.
 *
 * These map inspection domain values onto the app's existing Badge variants so
 * inspection rows read identically to issues, tasks and finance rows.
 */

import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/index';
import {
  type InspectionResult,
  type InspectionStatus,
  type InspectionType,
  type DefectSeverity,
  type Ncr,
  type NcrStatus,
  isNcrOverdue,
  ncrDaysOverdue,
  defectSeverityLabels,
  defectSeverityVariants,
  inspectionResultLabels,
  inspectionResultVariants,
  inspectionStatusLabels,
  inspectionStatusVariants,
  inspectionTypeLabels,
  ncrStatusLabels,
  ncrStatusVariants,
} from '@/types/inspection';

export function InspectionStatusBadge({
  status,
}: {
  status: InspectionStatus;
}) {
  return (
    <Badge variant={inspectionStatusVariants[status]}>
      {inspectionStatusLabels[status]}
    </Badge>
  );
}

export function InspectionResultBadge({
  result,
}: {
  result?: InspectionResult;
}) {
  if (!result) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <Badge variant={inspectionResultVariants[result]}>
      {inspectionResultLabels[result]}
    </Badge>
  );
}

export function InspectionTypeBadge({ type }: { type: InspectionType }) {
  return <Badge variant="outline">{inspectionTypeLabels[type]}</Badge>;
}

export function NcrStatusBadge({ status }: { status: NcrStatus }) {
  return (
    <Badge variant={ncrStatusVariants[status]}>{ncrStatusLabels[status]}</Badge>
  );
}

export function NcrSeverityBadge({
  severity,
}: {
  severity: DefectSeverity;
}) {
  return (
    <Badge variant={defectSeverityVariants[severity]}>
      {defectSeverityLabels[severity]}
    </Badge>
  );
}

/**
 * Due date with its own overdue treatment.
 *
 * A defect tracker's whole job is surfacing what has run late, so the date is
 * never rendered as neutral text once it has passed: it carries the colour
 * and the day count with it wherever it appears.
 */
export function NcrDueDate({ ncr }: { ncr: Ncr }) {
  if (!ncr.targetDate) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const overdue = isNcrOverdue(ncr);
  const days = ncrDaysOverdue(ncr);

  return (
    <span
      className={cn(
        'block text-sm whitespace-nowrap',
        overdue ? 'text-destructive font-medium' : 'text-muted-foreground'
      )}
    >
      {format(new Date(ncr.targetDate), 'dd MMM yyyy')}
      {overdue && (
        <span className="block text-xs font-normal">
          {days} {days === 1 ? 'day' : 'days'} overdue
        </span>
      )}
    </span>
  );
}

/** Compact overdue marker for rows too narrow to carry a full due date. */
export function NcrOverdueBadge({ ncr }: { ncr: Ncr }) {
  if (!isNcrOverdue(ncr)) return null;

  return (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="size-3" />
      Overdue
    </Badge>
  );
}
