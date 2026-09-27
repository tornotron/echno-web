'use client';

import { FileText } from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import type { WbsActivity } from '@tornotron/echno-core/wbs/types';
import type { ProgressInspection } from '@tornotron/echno-core/work-progress/types';
import {
  useProgressInspectionEvidence,
  useProgressInspections,
} from '@tornotron/echno-core/work-progress/hooks';
import { Badge } from '@/components/shadcn/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Skeleton } from '@/components/shadcn/skeleton';
import { DELAY_REASON_LABELS, OUTCOME_LABELS } from '../lib/labels';
import { delayLabel } from '../lib/schedule';

interface ProgressHistoryDialogProps {
  projectId: number;
  activity: WbsActivity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Every progress inspection of one activity, newest first, with its evidence. */
export function ProgressHistoryDialog({
  projectId,
  activity,
  open,
  onOpenChange,
}: ProgressHistoryDialogProps) {
  const { data, isPending, isError, error } = useProgressInspections(
    { projectId, wbsElementId: activity.id, pageSize: 50 },
    { enabled: open }
  );
  const records = data?.content ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Progress history</DialogTitle>
          <DialogDescription>
            {activity.wbsCode} {activity.title}
          </DialogDescription>
        </DialogHeader>
        {isPending && <Skeleton className="h-24 w-full" />}
        {isError && (
          <p role="alert" className="text-destructive text-sm">
            Could not load the progress history: {getErrorMessage(error)}
          </p>
        )}
        {!isPending && !isError && records.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No progress inspections recorded for this activity yet.
          </p>
        )}
        <ul className="space-y-3">
          {records.map((record) => (
            <HistoryItem key={record.id} record={record} />
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function HistoryItem({ record }: { record: ProgressInspection }) {
  const late = delayLabel(record.delayDays);
  return (
    <li
      className="space-y-2 rounded-md border p-3 text-sm"
      data-testid="progress-record"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{record.inspectionDate}</span>
        <Badge variant="outline">{OUTCOME_LABELS[record.outcome]}</Badge>
        <span>{record.percentComplete}% complete</span>
        {late && (
          <Badge
            variant={(record.delayDays ?? 0) > 0 ? 'destructive' : 'secondary'}
          >
            {late}
          </Badge>
        )}
      </div>
      <dl className="text-muted-foreground grid gap-x-4 gap-y-1 sm:grid-cols-2">
        {record.actualStartDate && (
          <div>
            <dt className="inline">Started: </dt>
            <dd className="inline">{record.actualStartDate}</dd>
          </div>
        )}
        {record.actualFinishDate && (
          <div>
            <dt className="inline">Finished: </dt>
            <dd className="inline">{record.actualFinishDate}</dd>
          </div>
        )}
        {record.forecastFinishDate && (
          <div>
            <dt className="inline">Revised finish: </dt>
            <dd className="inline">{record.forecastFinishDate}</dd>
          </div>
        )}
        {record.plannedFinishDate && (
          <div>
            <dt className="inline">Planned finish then: </dt>
            <dd className="inline">{record.plannedFinishDate}</dd>
          </div>
        )}
        {record.delayReason && (
          <div className="sm:col-span-2">
            <dt className="inline">Reason: </dt>
            <dd className="inline">
              {DELAY_REASON_LABELS[record.delayReason]}
              {record.delayNotes ? `, ${record.delayNotes}` : ''}
            </dd>
          </div>
        )}
        {record.remarks && (
          <div className="sm:col-span-2">
            <dt className="inline">Remarks: </dt>
            <dd className="inline">{record.remarks}</dd>
          </div>
        )}
        <div className="sm:col-span-2">
          <dt className="inline">Recorded by: </dt>
          <dd className="inline">{record.inspectorName ?? 'Not recorded'}</dd>
        </div>
      </dl>
      <RecordEvidence id={record.id} />
    </li>
  );
}

function RecordEvidence({ id }: { id: string }) {
  const { data: files } = useProgressInspectionEvidence(id);
  if (!files || files.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {files.map((file) => (
        <a
          key={file.id}
          href={file.file}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
        >
          <FileText className="size-3.5" />
          {file.fileName}
        </a>
      ))}
    </div>
  );
}
