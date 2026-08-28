'use client';

/**
 * The NCR detail body, shared verbatim by the triage sheet and the full route,
 * so the two surfaces can never drift apart.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/shadcn/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAssignNcr,
  useCloseNcr,
  useCompleteCorrectiveAction,
  useInspectionById,
  useNcrById,
  useRejectNcr,
  useReopenNcr,
  useVerifyNcr,
} from '@/hooks/inspection';
import { routes } from '@/nav';
import {
  type Ncr,
  type NcrAction,
  availableNcrActions,
  ncrActionLabels,
  ncrTypeLabels,
} from '@/types/inspection';
import { NcrSeverityBadge, NcrStatusBadge } from './inspection-badges';

export function NcrDetail({ ncrId }: { ncrId: string }) {
  const { data: ncr, isLoading } = useNcrById(ncrId);
  // The NCR carries only the inspection id, so the source card fetches the
  // inspection itself for its number, title and matching defect row.
  const { data: inspection } = useInspectionById(ncr?.inspectionId ?? '');
  const employeeName = useEmployeeNames();

  if (isLoading) return <DetailSkeleton />;

  if (!ncr) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        This NCR could not be found.
      </p>
    );
  }

  const defect = inspection?.defects.find((row) => row.id === ncr.defectId);

  return (
    <div className="space-y-6">
      {/* ── Facts ───────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <NcrStatusBadge status={ncr.status} />
          <NcrSeverityBadge severity={ncr.severity} />
          <Badge variant="outline">{ncrTypeLabels[ncr.type]}</Badge>
          <span className="text-muted-foreground text-xs">{ncr.ncrNumber}</span>
        </div>

        {ncr.description && (
          <p className="text-sm leading-relaxed">{ncr.description}</p>
        )}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Fact label="Site engineer">
            {employeeName(ncr.siteEngineerId) ?? 'Unassigned'}
          </Fact>
          <Fact label="Target date">
            {ncr.targetDate
              ? format(new Date(ncr.targetDate), 'dd MMM yyyy')
              : '—'}
          </Fact>
          <Fact label="Raised by">{employeeName(ncr.raisedById) ?? '—'}</Fact>
          <Fact label="Raised">
            {ncr.createdAt
              ? format(new Date(ncr.createdAt), 'dd MMM yyyy')
              : '—'}
          </Fact>
        </dl>
      </div>

      {/* ── Workflow ────────────────────────────────────────────────────── */}
      <NcrActions ncr={ncr} />

      {/* ── Source inspection ───────────────────────────────────────────── */}
      <Card variant="panel" className="p-3">
        <Link
          href={routes.inspections.detail(ncr.inspectionId).href}
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
              {inspection
                ? `${inspection.inspectionNumber} · ${inspection.title}`
                : 'Open inspection'}
            </p>
            {defect && (
              <p className="text-muted-foreground truncate text-xs">
                Defect: {defect.description}
              </p>
            )}
          </div>
          <ArrowRight className="text-muted-foreground mt-1 size-4 shrink-0" />
        </Link>
      </Card>

      <Separator />

      {/* ── Timeline ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Progress</h3>
        <Timeline ncr={ncr} employeeName={employeeName} />
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Workflow
// ---------------------------------------------------------------------------

/** The steps that carry free-text remarks; `assign` and `close` do not. */
type RemarksAction = Exclude<NcrAction, 'assign' | 'close'>;

const REMARKS_PROMPTS: Record<RemarksAction, string> = {
  'corrective-action-complete':
    'Describe the correction that was carried out. Optional, but it is what the verifier reads.',
  verify: 'Record what was checked on site. Optional.',
  reject: 'Say why the correction was not accepted, so the rework is targeted.',
  reopen: 'Say what brought this NCR back. Optional.',
};

/**
 * Lifecycle controls.
 *
 * There is no settable status: the backend exposes one endpoint per
 * transition, so the buttons come from `availableNcrActions` and nothing else
 * is offered. Rejecting or reopening sends work back to somebody, so both ask
 * for remarks first rather than firing on a single click.
 */
function NcrActions({ ncr }: { ncr: Ncr }) {
  const assign = useAssignNcr();
  const complete = useCompleteCorrectiveAction();
  const verify = useVerifyNcr();
  const reject = useRejectNcr();
  const reopen = useReopenNcr();
  const close = useCloseNcr();

  const [assignOpen, setAssignOpen] = useState(false);
  const [remarksFor, setRemarksFor] = useState<RemarksAction | undefined>();

  const actions = availableNcrActions(ncr.status);
  if (actions.length === 0) return null;

  const isPending =
    assign.isPending ||
    complete.isPending ||
    verify.isPending ||
    reject.isPending ||
    reopen.isPending ||
    close.isPending;

  const start = (action: NcrAction) => {
    if (action === 'assign') return setAssignOpen(true);
    if (action === 'close') return close.mutate(ncr.id);
    setRemarksFor(action);
  };

  const submitRemarks = (action: RemarksAction, remarks: string) => {
    const trimmed = remarks.trim();
    const variables = {
      id: ncr.id,
      req: trimmed === '' ? undefined : { remarks: trimmed },
    };
    const done = { onSuccess: () => setRemarksFor(undefined) };

    switch (action) {
      case 'corrective-action-complete': {
        complete.mutate(variables, done);
        break;
      }
      case 'verify': {
        verify.mutate(variables, done);
        break;
      }
      case 'reject': {
        reject.mutate(variables, done);
        break;
      }
      case 'reopen': {
        reopen.mutate(variables, done);
        break;
      }
    }
  };

  return (
    <Card className="gap-3 p-4">
      <h3 className="text-sm font-semibold">Actions</h3>

      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action}
            size="sm"
            variant={
              action === 'reject' || action === 'reopen' ? 'outline' : 'default'
            }
            disabled={isPending}
            onClick={() => start(action)}
          >
            {ncrActionLabels[action]}
          </Button>
        ))}
      </div>

      {/*
        Keyed on the row's own version so a reassignment made elsewhere is
        picked up by the form's initial state rather than being overwritten.
      */}
      <AssignDialog
        key={ncr.updatedAt ?? ncr.id}
        ncr={ncr}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        isPending={assign.isPending}
        onSubmit={(siteEngineerId, targetDate) =>
          assign.mutate(
            { id: ncr.id, req: { siteEngineerId, targetDate } },
            { onSuccess: () => setAssignOpen(false) }
          )
        }
      />

      <RemarksDialog
        action={remarksFor}
        isPending={isPending}
        onOpenChange={(open) => !open && setRemarksFor(undefined)}
        onSubmit={submitRemarks}
      />
    </Card>
  );
}

const UNASSIGNED = 'UNASSIGNED';

function AssignDialog({
  ncr,
  open,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  ncr: Ncr;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (siteEngineerId: number, targetDate?: string) => void;
}) {
  const { data: employees = [] } = useEmployeeLookup();
  const [engineer, setEngineer] = useState(
    ncr.siteEngineerId ? String(ncr.siteEngineerId) : UNASSIGNED
  );
  const [targetDate, setTargetDate] = useState(ncr.targetDate ?? '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign NCR</DialogTitle>
          <DialogDescription>
            Assignment is what turns a raised NCR into somebody&apos;s work, so
            the engineer is required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ncr-assign-engineer">Site engineer</Label>
            <Select value={engineer} onValueChange={setEngineer}>
              <SelectTrigger id="ncr-assign-engineer" className="w-full">
                <SelectValue placeholder="Select an engineer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED} disabled>
                  Select an engineer
                </SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={String(employee.id)}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ncr-assign-target">Target date</Label>
            <Input
              id="ncr-assign-target"
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={engineer === UNASSIGNED || isPending}
            onClick={() =>
              onSubmit(
                Number(engineer),
                targetDate === '' ? undefined : targetDate
              )
            }
          >
            {isPending ? 'Assigning…' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemarksDialog({
  action,
  isPending,
  onOpenChange,
  onSubmit,
}: {
  action?: RemarksAction;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (action: RemarksAction, remarks: string) => void;
}) {
  const [remarks, setRemarks] = useState('');

  return (
    <Dialog
      open={Boolean(action)}
      onOpenChange={(open) => {
        if (!open) setRemarks('');
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-md">
        {action && (
          <>
            <DialogHeader>
              <DialogTitle>{ncrActionLabels[action]}</DialogTitle>
              <DialogDescription>{REMARKS_PROMPTS[action]}</DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label htmlFor="ncr-remarks">Remarks</Label>
              <Textarea
                id="ncr-remarks"
                rows={4}
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                disabled={isPending}
                onClick={() => onSubmit(action, remarks)}
              >
                {isPending ? 'Saving…' : ncrActionLabels[action]}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

interface TimelineStep {
  key: string;
  label: string;
  icon: LucideIcon;
  at: string;
  by?: number;
  remarks?: string;
}

/**
 * Progress read off the NCR's own timestamps.
 *
 * The backend keeps no transition history table, only the moment each
 * lifecycle step was reached, so a step appears here exactly when its
 * timestamp is set. Rejection and reopening leave no timestamp of their own,
 * which is why a rejected NCR shows the work done so far and its remarks
 * rather than a rejection entry.
 */
function Timeline({
  ncr,
  employeeName,
}: {
  ncr: Ncr;
  employeeName: (id?: number) => string | undefined;
}) {
  const steps: TimelineStep[] = [
    {
      key: 'raised',
      label: 'Raised',
      icon: Flag,
      at: ncr.createdAt ?? '',
      by: ncr.raisedById,
    },
    {
      key: 'corrected',
      label: 'Corrective action completed',
      icon: Wrench,
      at: ncr.correctiveActionCompletedAt ?? '',
      remarks: ncr.correctiveActionRemarks,
    },
    {
      key: 'verified',
      label: 'Verified',
      icon: ShieldCheck,
      at: ncr.verifiedAt ?? '',
      remarks: ncr.verificationRemarks,
    },
    {
      key: 'closed',
      label: 'Closed',
      icon: CheckCircle2,
      at: ncr.closedAt ?? '',
      by: ncr.closedById,
    },
  ].filter((step) => step.at !== '');

  // Remarks can outlive the step that produced them: rejecting clears the
  // corrective-action timestamp but keeps the text, and it is the text the
  // engineer needs. Show whatever the timeline could not place.
  const orphaned: string[] = [];
  if (!ncr.correctiveActionCompletedAt && ncr.correctiveActionRemarks) {
    orphaned.push(ncr.correctiveActionRemarks);
  }
  if (!ncr.verifiedAt && ncr.verificationRemarks) {
    orphaned.push(ncr.verificationRemarks);
  }

  if (steps.length === 0 && orphaned.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">
        Nothing recorded against this NCR yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {orphaned.map((text, index) => (
        <div key={index} className="bg-muted/50 rounded-lg p-3">
          <p className="text-muted-foreground text-xs font-medium">Remarks</p>
          <p className="text-sm">{text}</p>
        </div>
      ))}

      <ol className="space-y-4">
        {steps.map((step) => (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="bg-muted grid size-7 shrink-0 place-items-center rounded-full">
                <step.icon className="text-muted-foreground size-3.5" />
              </div>
              <div className="bg-border mt-1 w-px flex-1" />
            </div>

            <div className="min-w-0 flex-1 space-y-1 pb-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-medium">{step.label}</span>
                <span className="text-muted-foreground text-xs">
                  {format(new Date(step.at), 'dd MMM yyyy, HH:mm')}
                </span>
              </div>

              {step.by != null && (
                <p className="text-muted-foreground text-xs">
                  {employeeName(step.by)}
                </p>
              )}

              {step.remarks && (
                <p className="text-sm leading-relaxed">{step.remarks}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------

/**
 * Resolves an employee id to a display name.
 *
 * The NCR stores ids only. The lookup projection is used rather than the full
 * employee list because it is readable by any tenant member, and the people
 * working NCRs will usually not hold the management role the full list needs.
 */
function useEmployeeNames() {
  const { data: employees = [] } = useEmployeeLookup();

  const byId = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee.name])),
    [employees]
  );

  return (id?: number): string | undefined => {
    if (id == null) return undefined;
    // Falls back to the bare id so somebody outside the readable directory
    // still reads as a person rather than as nobody.
    return byId.get(id) ?? `#${id}`;
  };
}

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
