'use client';

/**
 * The NCR detail body — shared verbatim by the triage sheet and the full
 * route, so the two surfaces can never drift apart.
 */

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowRight,
  ClipboardCheck,
  MessageSquare,
  UserCheck,
} from 'lucide-react';
import { useEmployees } from '@tornotron/echno-core/employee/hooks';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Separator } from '@/components/shadcn/separator';
import { Skeleton } from '@/components/shadcn/skeleton';
import { Textarea } from '@/components/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  useAddNcrComment,
  useNcrComments,
  useNcrDefect,
  useResponsibleName,
  useUpdateNcrDefect,
} from '@/hooks/inspection';
import { routes } from '@/nav';
import {
  type NcrComment,
  type NcrDefect,
  NcrStatus,
  SETTLED_STATUSES,
  ncrStatusLabels,
  nextNcrStatuses,
} from '@/types/inspection';
import { AttachmentGallery, MediaPicker } from './attachment-gallery';
import { NcrSeverityBadge, NcrStatusBadge } from './inspection-badges';

const NO_TRANSITION = 'NONE';

export function NcrDetail({ ncrId }: { ncrId: number }) {
  const { data: defect, isLoading } = useNcrDefect(ncrId);
  const { data: comments = [], isLoading: isTimelineLoading } =
    useNcrComments(ncrId);
  const responsibleName = useResponsibleName();

  if (isLoading) return <DetailSkeleton />;

  if (!defect) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        This NCR could not be found.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Facts ───────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <NcrStatusBadge status={defect.status} />
          <NcrSeverityBadge severity={defect.severity} />
          <span className="text-muted-foreground text-xs">
            {defect.ncrNumber}
          </span>
        </div>

        {defect.description && (
          <p className="text-sm leading-relaxed">{defect.description}</p>
        )}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Fact label="Project">
            {defect.projectName ?? `#${defect.projectId}`}
          </Fact>
          <Fact label="Location">{defect.location ?? '—'}</Fact>
          <Fact label="Responsible">{responsibleName(defect) ?? '—'}</Fact>
          <Fact label="Due">
            {defect.dueDate ? format(defect.dueDate, 'dd MMM yyyy') : '—'}
          </Fact>
          <Fact label="Raised by">{defect.createdByName ?? '—'}</Fact>
          <Fact label="Raised">{format(defect.createdAt, 'dd MMM yyyy')}</Fact>
        </dl>

        {defect.correctiveAction && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-muted-foreground text-xs font-medium">
              Corrective action
            </p>
            <p className="text-sm">{defect.correctiveAction}</p>
          </div>
        )}
      </div>

      {/* ── Ownership ───────────────────────────────────────────────────── */}
      <AssignmentPanel key={defect.updatedAt.getTime()} defect={defect} />

      {/* ── Source inspection ───────────────────────────────────────────── */}
      {defect.inspectionId && (
        <Card variant="panel" className="p-3">
          <Link
            href={routes.inspections.detail(defect.inspectionId).href}
            className="group flex items-start gap-3"
          >
            <div className="bg-muted grid size-9 shrink-0 place-items-center rounded-lg">
              <ClipboardCheck className="text-muted-foreground size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs">
                Raised from inspection
              </p>
              <p className="truncate text-sm font-medium group-hover:underline">
                {defect.inspectionTitle ?? `Inspection #${defect.inspectionId}`}
              </p>
              {defect.checklistElementLabel && (
                <p className="text-muted-foreground truncate text-xs">
                  Failed item: {defect.checklistElementLabel}
                </p>
              )}
            </div>
            <ArrowRight className="text-muted-foreground mt-1 size-4 shrink-0" />
          </Link>
        </Card>
      )}

      {/* ── Evidence ────────────────────────────────────────────────────── */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Evidence</h3>
        <AttachmentGallery
          attachments={defect.evidence}
          emptyMessage="No evidence was attached when this NCR was raised."
        />
      </section>

      <Separator />

      {/* ── Timeline ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Progress</h3>

        <Timeline comments={comments} isLoading={isTimelineLoading} />

        <AddUpdateForm ncrId={ncrId} currentStatus={defect.status} />
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ownership
// ---------------------------------------------------------------------------

const UNASSIGNED = 'UNASSIGNED';

/**
 * Who owns the defect and by when.
 *
 * Kept inline rather than behind a dialog: assignment is the step that turns a
 * raised NCR into somebody's work, and burying the only control that does it
 * is how defects end up sitting unowned.
 */
function AssignmentPanel({ defect }: { defect: NcrDefect }) {
  const updateDefect = useUpdateNcrDefect();
  const { data: employees = [] } = useEmployees();

  const currentResponsible = defect.responsibleId
    ? String(defect.responsibleId)
    : UNASSIGNED;
  const currentDue = defect.dueDate ? format(defect.dueDate, 'yyyy-MM-dd') : '';

  const [responsible, setResponsible] = useState(currentResponsible);
  const [dueDate, setDueDate] = useState(currentDue);

  // A defect nobody has to act on any more should not invite reassignment.
  if (SETTLED_STATUSES.has(defect.status)) return null;

  const dirty = responsible !== currentResponsible || dueDate !== currentDue;

  const save = () => {
    const responsibleId =
      responsible === UNASSIGNED ? null : Number(responsible);

    updateDefect.mutate({
      id: defect.id,
      dto: {
        responsibleId,
        dueDate: dueDate === '' ? null : dueDate,
        // Handing a fresh NCR to someone is what "assigned" means — move it
        // with the assignment rather than making that a second, separate step.
        ...(responsibleId !== null &&
          defect.status === NcrStatus.open && {
            status: NcrStatus.assigned,
          }),
      },
    });
  };

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center gap-2">
        <UserCheck className="text-muted-foreground size-4" />
        <h3 className="text-sm font-semibold">Assignment</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ncr-responsible" className="text-xs font-medium">
            Responsible
          </Label>
          <Select value={responsible} onValueChange={setResponsible}>
            <SelectTrigger id="ncr-responsible" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={String(employee.id)}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ncr-due-date" className="text-xs font-medium">
            Due date
          </Label>
          <Input
            id="ncr-due-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!dirty || updateDefect.isPending}
          onClick={save}
        >
          {updateDefect.isPending ? 'Saving…' : 'Save assignment'}
        </Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

function Timeline({
  comments,
  isLoading,
}: {
  comments: NcrComment[];
  isLoading: boolean;
}) {
  if (isLoading) return <Skeleton className="h-24 w-full" />;

  if (comments.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">
        No updates yet. Post the first one below.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {comments.map((comment) => (
        <li key={comment.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="bg-muted grid size-7 shrink-0 place-items-center rounded-full">
              <MessageSquare className="text-muted-foreground size-3.5" />
            </div>
            <div className="bg-border mt-1 w-px flex-1" />
          </div>

          <div className="min-w-0 flex-1 space-y-2 pb-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-medium">
                {comment.authorName ?? 'Unknown'}
              </span>
              <span className="text-muted-foreground text-xs">
                {format(comment.createdAt, 'dd MMM yyyy, HH:mm')}
              </span>
            </div>

            {comment.toStatus && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {comment.fromStatus && (
                  <>
                    <NcrStatusBadge status={comment.fromStatus} />
                    <ArrowRight className="text-muted-foreground size-3" />
                  </>
                )}
                <NcrStatusBadge status={comment.toStatus} />
              </div>
            )}

            {comment.body && (
              <p className="text-sm leading-relaxed">{comment.body}</p>
            )}

            <AttachmentGallery
              attachments={comment.attachments}
              className="sm:grid-cols-2 lg:grid-cols-3"
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Update composer
// ---------------------------------------------------------------------------

function AddUpdateForm({
  ncrId,
  currentStatus,
}: {
  ncrId: number;
  currentStatus: NcrStatus;
}) {
  const addComment = useAddNcrComment();
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [toStatus, setToStatus] = useState(NO_TRANSITION);

  const transitions = nextNcrStatuses(currentStatus);
  const canSubmit = body.trim() !== '' || files.length > 0;

  const submit = () => {
    addComment.mutate(
      {
        id: ncrId,
        dto: {
          body: body.trim(),
          files: files.length > 0 ? files : undefined,
          toStatus:
            toStatus === NO_TRANSITION ? undefined : (toStatus as NcrStatus),
        },
      },
      {
        onSuccess: () => {
          setBody('');
          setFiles([]);
          setToStatus(NO_TRANSITION);
        },
      }
    );
  };

  return (
    <Card className="gap-3 p-4">
      <Textarea
        rows={3}
        value={body}
        placeholder="Describe the progress, the fix, or what is blocking it…"
        onChange={(event) => setBody(event.target.value)}
      />

      <MediaPicker files={files} onChange={setFiles} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        {transitions.length > 0 ? (
          <Select value={toStatus} onValueChange={setToStatus}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_TRANSITION}>Comment Only</SelectItem>
              {transitions.map((status) => (
                <SelectItem key={status} value={status}>
                  Move to {ncrStatusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-muted-foreground text-xs">
            This NCR is closed.
          </span>
        )}

        <Button
          size="sm"
          disabled={!canSubmit || addComment.isPending}
          onClick={submit}
        >
          {addComment.isPending ? 'Posting…' : 'Post update'}
        </Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="truncate text-sm">{children}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
