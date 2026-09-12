'use client';

/**
 * Reinspection attempts on an NCR, and the two dialogs that create and settle
 * them.
 *
 * A reinspection is the inspection that produced a verification. Before it
 * existed a verifier ticked "verified" and nothing recorded which check points
 * were re-run or how many attempts it took. Each attempt here links to the
 * inspection cloned for the re-check, carries its sequence and outcome, and a
 * passed one is what the verify step can then name.
 */

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { Checkbox } from '@/components/shadcn/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Skeleton } from '@/components/shadcn/skeleton';
import { Textarea } from '@/components/shadcn/textarea';
import {
  useRecordReinspectionOutcome,
  useReinspectionsByNcr,
  useScheduleReinspectionForDefect,
  useScheduleReinspectionForNcr,
} from '@/hooks/inspection';
import { employeeReferenceLabel } from '@/lib/utils/user-reference';
import { routes } from '@/nav';
import {
  type Ncr,
  NcrStatus,
  type Reinspection,
  ReinspectionOutcome,
  type ScheduleReinspectionRequest,
  hasPendingReinspection,
  reinspectionOutcomeLabels,
} from '@/types/inspection';

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

/**
 * The attempts on one NCR, newest first, with "Schedule reinspection" while
 * the report awaits verification and no attempt is still open, and "Record
 * outcome" on the open one.
 */
export function ReinspectionSection({ ncr }: { ncr: Ncr }) {
  const { data: attempts = [], isLoading } = useReinspectionsByNcr(ncr.id);
  const schedule = useScheduleReinspectionForNcr();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [outcomeFor, setOutcomeFor] = useState<Reinspection | undefined>();

  // The backend refuses a schedule unless the NCR is awaiting verification,
  // and a second attempt belongs after the first is decided.
  const canSchedule =
    ncr.status === NcrStatus.CORRECTIVE_ACTION_COMPLETE &&
    !hasPendingReinspection(attempts);

  const ordered = attempts.toSorted((a, b) => b.sequence - a.sequence);

  return (
    <section className="space-y-3" data-testid="reinspection-section">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Reinspections</h3>
        {canSchedule && (
          <Button
            size="sm"
            variant="outline"
            disabled={schedule.isPending}
            onClick={() => setScheduleOpen(true)}
          >
            <RotateCcw className="size-4" />
            Schedule reinspection
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : ordered.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          {ncr.status === NcrStatus.CORRECTIVE_ACTION_COMPLETE
            ? 'No reinspection scheduled yet. Verification without one is allowed, but a recorded re-check is what the acceptance rests on.'
            : 'No reinspections recorded.'}
        </p>
      ) : (
        <ol className="space-y-2">
          {ordered.map((attempt) => (
            <li key={attempt.id}>
              <ReinspectionRow
                attempt={attempt}
                onRecordOutcome={() => setOutcomeFor(attempt)}
              />
            </li>
          ))}
        </ol>
      )}

      <ScheduleReinspectionDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        isPending={schedule.isPending}
        subject={`NCR ${ncr.ncrNumber}`}
        onSubmit={(req) =>
          schedule.mutate(
            { ncrId: ncr.id, req },
            { onSuccess: () => setScheduleOpen(false) }
          )
        }
      />

      <RecordOutcomeDialog
        attempt={outcomeFor}
        onOpenChange={(open) => !open && setOutcomeFor(undefined)}
      />
    </section>
  );
}

function ReinspectionRow({
  attempt,
  onRecordOutcome,
}: {
  attempt: Reinspection;
  onRecordOutcome: () => void;
}) {
  const employeeName = useEmployeeNames();
  const pending = attempt.outcome === ReinspectionOutcome.PENDING;

  return (
    <Card variant="panel" className="space-y-2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Attempt {attempt.sequence}</span>
        <ReinspectionOutcomeBadge outcome={attempt.outcome} />
        {attempt.targetDate && (
          <span className="text-muted-foreground text-xs">
            due {format(new Date(attempt.targetDate), 'dd MMM yyyy')}
          </span>
        )}
        {pending && (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={onRecordOutcome}
          >
            Record outcome
          </Button>
        )}
      </div>

      <dl className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>
          <dt className="font-medium">Inspector</dt>
          <dd>
            {attempt.assignedInspectorId == null
              ? 'Unassigned'
              : (employeeName(attempt.assignedInspectorId) ??
                employeeReferenceLabel(attempt.assignedInspectorId))}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Requested</dt>
          <dd>
            {attempt.requestedAt
              ? format(new Date(attempt.requestedAt), 'dd MMM yyyy, HH:mm')
              : '—'}
            {attempt.requestedById != null &&
              ` by ${employeeName(attempt.requestedById)}`}
          </dd>
        </div>
        {!pending && (
          <div className="col-span-2">
            <dt className="font-medium">Outcome recorded</dt>
            <dd>
              {attempt.outcomeAt
                ? format(new Date(attempt.outcomeAt), 'dd MMM yyyy, HH:mm')
                : '—'}
              {attempt.outcomeById != null &&
                ` by ${employeeName(attempt.outcomeById)}`}
            </dd>
          </div>
        )}
      </dl>

      {attempt.remarks && (
        <p className="text-sm leading-relaxed">{attempt.remarks}</p>
      )}

      <Link
        href={routes.inspections.detail(attempt.reinspectionInspectionId).href}
        className="text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline"
      >
        Open reinspection inspection
        <ArrowRight className="size-3" />
      </Link>
    </Card>
  );
}

/** Outcome as a badge; pending is neutral, passed green, failed red. */
export function ReinspectionOutcomeBadge({
  outcome,
}: {
  outcome: ReinspectionOutcome;
}) {
  const className =
    outcome === ReinspectionOutcome.PASSED
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : outcome === ReinspectionOutcome.FAILED
        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300';
  return (
    <Badge className={className}>{reinspectionOutcomeLabels[outcome]}</Badge>
  );
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

const UNASSIGNED = 'UNASSIGNED';

/**
 * Asks for the inspector, the due date and whether to copy every check point
 * of the original rather than only the failed ones. Everything is optional;
 * the backend clones the original inspection and numbers the attempt.
 */
export function ScheduleReinspectionDialog({
  open,
  onOpenChange,
  isPending,
  subject,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  /** What is being re-checked, for the title. */
  subject: string;
  onSubmit: (req: ScheduleReinspectionRequest) => void;
}) {
  const { data: employees = [] } = useEmployeeLookup();
  const [inspector, setInspector] = useState(UNASSIGNED);
  const [targetDate, setTargetDate] = useState('');
  const [copyAllItems, setCopyAllItems] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule reinspection</DialogTitle>
          <DialogDescription>
            Creates a new inspection for {subject} with the failed check points
            reset, so the re-check is recorded rather than ticked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reinspection-inspector">Inspector</Label>
            <Select value={inspector} onValueChange={setInspector}>
              <SelectTrigger id="reinspection-inspector" className="w-full">
                <SelectValue placeholder="Select an inspector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>Assign later</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={String(employee.id)}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reinspection-target">Due date</Label>
            <Input
              id="reinspection-target"
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="reinspection-copy-all"
              checked={copyAllItems}
              onCheckedChange={(checked) => setCopyAllItems(checked === true)}
            />
            <Label htmlFor="reinspection-copy-all" className="font-normal">
              Copy every check point, not only the failed ones
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={isPending}
            onClick={() => {
              const req: ScheduleReinspectionRequest = {};
              if (inspector !== UNASSIGNED)
                req.assignedInspectorId = Number(inspector);
              if (targetDate !== '') req.targetDate = targetDate;
              if (copyAllItems) req.copyAllItems = true;
              onSubmit(req);
            }}
          >
            {isPending ? 'Scheduling…' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * "Schedule reinspection" for a defect that has no NCR of its own. Shown
 * where the UI lists an inspection's defects; the backend only accepts it for
 * a resolved defect, so the caller decides when to render it.
 */
export function DefectReinspectionButton({
  defectId,
  label,
}: {
  defectId: string;
  /** What the defect is, for the dialog title. */
  label: string;
}) {
  const schedule = useScheduleReinspectionForDefect();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={schedule.isPending}
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="size-4" />
        Schedule reinspection
      </Button>
      <ScheduleReinspectionDialog
        open={open}
        onOpenChange={setOpen}
        isPending={schedule.isPending}
        subject={label}
        onSubmit={(req) =>
          schedule.mutate(
            { defectId, req },
            { onSuccess: () => setOpen(false) }
          )
        }
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Outcome
// ---------------------------------------------------------------------------

/**
 * Records what the re-check found. A pass is what a verification can then
 * name; a fail moves the NCR back to rejected on the server.
 */
function RecordOutcomeDialog({
  attempt,
  onOpenChange,
}: {
  attempt?: Reinspection;
  onOpenChange: (open: boolean) => void;
}) {
  const record = useRecordReinspectionOutcome();
  const [outcome, setOutcome] = useState<
    ReinspectionOutcome.PASSED | ReinspectionOutcome.FAILED
  >(ReinspectionOutcome.PASSED);
  const [remarks, setRemarks] = useState('');

  return (
    <Dialog
      open={Boolean(attempt)}
      onOpenChange={(open) => {
        if (!open) {
          setRemarks('');
          setOutcome(ReinspectionOutcome.PASSED);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-md">
        {attempt && (
          <>
            <DialogHeader>
              <DialogTitle>
                Record outcome of attempt {attempt.sequence}
              </DialogTitle>
              <DialogDescription>
                Passed when the work now conforms; failed sends the NCR back to
                the site engineer.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reinspection-outcome">Outcome</Label>
                <Select
                  value={outcome}
                  onValueChange={(value) =>
                    setOutcome(
                      value === ReinspectionOutcome.FAILED
                        ? ReinspectionOutcome.FAILED
                        : ReinspectionOutcome.PASSED
                    )
                  }
                >
                  <SelectTrigger id="reinspection-outcome" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ReinspectionOutcome.PASSED}>
                      Passed
                    </SelectItem>
                    <SelectItem value={ReinspectionOutcome.FAILED}>
                      Failed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reinspection-remarks">Remarks</Label>
                <Textarea
                  id="reinspection-remarks"
                  rows={4}
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="What was seen on the re-check"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                disabled={record.isPending}
                onClick={() => {
                  const trimmed = remarks.trim();
                  record.mutate(
                    {
                      id: attempt.id,
                      req: {
                        outcome,
                        ...(trimmed === '' ? {} : { remarks: trimmed }),
                      },
                    },
                    { onSuccess: () => onOpenChange(false) }
                  );
                }}
              >
                {record.isPending ? 'Saving…' : 'Record outcome'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------

function useEmployeeNames() {
  const { data: employees = [] } = useEmployeeLookup();
  const byId = new Map(
    employees.map((employee) => [employee.id, employee.name])
  );
  return (id?: number): string | undefined => {
    if (id == null) return undefined;
    return byId.get(id) ?? `#${id}`;
  };
}
