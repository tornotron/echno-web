'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  FileDown,
  Loader2,
  Pencil,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { getErrorMessage } from '@tornotron/echno-core';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { EmployeeStatus } from '@tornotron/echno-core/employee/types';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import {
  useAddToolboxTalkAttendees,
  useRecordToolboxTalk,
  useRemoveToolboxTalkAttendee,
  useToolboxTalk,
} from '@tornotron/echno-core/toolbox-talks/hooks';
import { toolboxTalksService } from '@tornotron/echno-core/toolbox-talks/services';
import { ToolboxTalkStatus } from '@tornotron/echno-core/toolbox-talks/types';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Skeleton } from '@/components/shadcn/skeleton';
import { triggerBlobDownload } from '@/lib/utils/download';
import { routes } from '@/nav';
import { toolboxTalkStatusLabels } from '../lib/labels';
import { ToolboxTalkLocation } from './ToolboxTalkLocation';
import { ToolboxTalkPhotos } from './ToolboxTalkPhotos';

const SELECT_CLASS =
  'border-input bg-background h-9 rounded-md border px-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50';

interface ToolboxTalkDetailProps {
  talkId: string;
}

export function ToolboxTalkDetail({ talkId }: ToolboxTalkDetailProps) {
  const { data: talk, isPending, isError, error } = useToolboxTalk(talkId);
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployeeLookup();
  const record = useRecordToolboxTalk();
  const addAttendees = useAddToolboxTalkAttendees();
  const removeAttendee = useRemoveToolboxTalkAttendee();
  const [candidate, setCandidate] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const employeeName = useMemo(() => {
    const byId = new Map(
      employees.map((employee) => [employee.id, employee.name])
    );
    return (id: number) => byId.get(id) ?? `#${id}`;
  }, [employees]);

  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (isError || !talk) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {getErrorMessage(error)}
      </p>
    );
  }

  const draft = talk.status === ToolboxTalkStatus.DRAFT;
  const present = new Set(
    talk.attendees.map((attendee) => attendee.employeeId)
  );
  const addable = employees.filter(
    (employee) =>
      employee.status === EmployeeStatus.active && !present.has(employee.id)
  );
  const project = projects.find((item) => item.id === talk.projectId);
  const busy =
    record.isPending || addAttendees.isPending || removeAttendee.isPending;
  const failure = record.isError
    ? record.error
    : addAttendees.isError
      ? addAttendees.error
      : removeAttendee.isError
        ? removeAttendee.error
        : null;

  const downloadPdf = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const blob = await toolboxTalksService.downloadPdf(talk.id);
      triggerBlobDownload(
        blob,
        `toolbox-talk-${talk.talkDate}-${talk.id.slice(0, 8)}.pdf`
      );
    } catch (error_) {
      setDownloadError(getErrorMessage(error_));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" data-testid="toolbox-talk-detail">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{talk.topic}</h2>
            <Badge variant={draft ? 'outline' : 'default'}>
              {toolboxTalkStatusLabels[talk.status]}
            </Badge>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Project</dt>
            <dd>{project?.projectName ?? `#${talk.projectId}`}</dd>
            <dt className="text-muted-foreground">Location</dt>
            <dd>
              <ToolboxTalkLocation
                projectId={talk.projectId}
                spatialNodeId={talk.spatialNodeId}
              />
            </dd>
            <dt className="text-muted-foreground">Held on</dt>
            <dd>
              {talk.talkDate}
              {talk.talkTime ? ` at ${talk.talkTime.slice(0, 5)}` : ''}
            </dd>
            <dt className="text-muted-foreground">Conducted by</dt>
            <dd>{employeeName(talk.conductorEmployeeId)}</dd>
            {talk.recordedAt && (
              <>
                <dt className="text-muted-foreground">Recorded</dt>
                <dd>{new Date(talk.recordedAt).toLocaleString()}</dd>
              </>
            )}
          </dl>
        </div>
        <div className="flex flex-wrap gap-2">
          {draft && (
            <Button variant="outline" size="sm" asChild>
              <Link href={routes.toolboxTalks.detail(talk.id).edit}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={downloadPdf}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            Download PDF
          </Button>
          {draft && (
            <Button
              size="sm"
              disabled={busy || talk.attendees.length === 0}
              title={
                talk.attendees.length === 0
                  ? 'Add at least one attendee first'
                  : undefined
              }
              onClick={() => record.mutate(talk.id)}
            >
              {record.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Record talk
            </Button>
          )}
        </div>
      </div>

      {talk.notes && (
        <section className="flex flex-col gap-1">
          <h3 className="text-sm font-medium">Notes</h3>
          <p className="text-sm whitespace-pre-wrap">{talk.notes}</p>
        </section>
      )}

      <section
        className="flex flex-col gap-2"
        data-testid="toolbox-talk-attendees"
      >
        <h3 className="text-sm font-medium">
          Attendees ({talk.attendees.length})
        </h3>
        {talk.attendees.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Nobody has been added yet.
          </p>
        )}
        <ul className="flex flex-col divide-y rounded-md border">
          {talk.attendees.map((attendee) => (
            <li
              key={attendee.employeeId}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
              <span>{employeeName(attendee.employeeId)}</span>
              {draft && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  aria-label={`Remove ${employeeName(attendee.employeeId)}`}
                  onClick={() =>
                    removeAttendee.mutate({
                      id: talk.id,
                      employeeId: attendee.employeeId,
                    })
                  }
                >
                  <UserMinus className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
        {draft && (
          <div className="flex items-center gap-2">
            <select
              aria-label="Add attendee"
              className={SELECT_CLASS}
              value={candidate}
              onChange={(event) => setCandidate(event.target.value)}
            >
              <option value="">Select an employee</option>
              {addable.map((employee) => (
                <option key={employee.id} value={String(employee.id)}>
                  {employee.name}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              disabled={busy || candidate === ''}
              onClick={() => {
                addAttendees.mutate(
                  { id: talk.id, data: { employeeIds: [Number(candidate)] } },
                  { onSuccess: () => setCandidate('') }
                );
              }}
            >
              <UserPlus className="size-4" />
              Add
            </Button>
          </div>
        )}
      </section>

      <ToolboxTalkPhotos talkId={talk.id} />

      {(failure || downloadError) && (
        <p role="alert" className="text-destructive text-sm">
          {downloadError ?? getErrorMessage(failure)}
        </p>
      )}
    </div>
  );
}
