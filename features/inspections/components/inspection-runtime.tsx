'use client';

/**
 * The live inspection page: recording what was found at each check point.
 *
 * An inspection carries its own check items, and those items are both the
 * checklist and the record of the visit. There is no separate submission to
 * save into, so this edits the items in place and persists them through the
 * inspection's own update endpoint, which replaces the whole set.
 */

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AlertCircle, ChevronDown, Save, Send } from 'lucide-react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { useProjects } from '@tornotron/echno-core/project/hooks';
import { PageHeader } from '@/components/common';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils/index';
import { toast } from '@/lib/styles/toast-styles';
import { useInspectionById, useUpdateInspection } from '@/hooks/inspection';
import {
  CheckItemStatus,
  InspectionStatus,
  checkItemStatusLabels,
  compliancePercentage,
  resultFromCompliance,
  type Inspection,
  type InspectionCheckItemRequest,
  type UpdateInspectionRequest,
} from '@/types/inspection';
import { CreateNcrDialog } from './create-ncr-dialog';
import {
  InspectionResultBadge,
  InspectionStatusBadge,
  InspectionTypeBadge,
} from './inspection-badges';

/** Once an inspection has been concluded its record is history, not a form. */
const CLOSED_STATUSES = new Set<InspectionStatus>([
  InspectionStatus.COMPLETED,
  InspectionStatus.PASSED,
  InspectionStatus.PASSED_WITH_REMARKS,
  InspectionStatus.FAILED,
  InspectionStatus.CANCELLED,
]);

/** Check points with no category of their own still need a heading to sit under. */
const UNGROUPED = 'Other checks';

export function InspectionRuntime({ inspectionId }: { inspectionId: string }) {
  const { data: inspection, isLoading } = useInspectionById(inspectionId);

  if (isLoading) return <RuntimeSkeleton />;

  if (!inspection) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Inspection not found</AlertTitle>
        <AlertDescription>
          It may have been deleted, or you may not have access to it.
        </AlertDescription>
      </Alert>
    );
  }

  // Keyed on the last server write, so a save re-seeds the form from what was
  // actually stored (ids and all) rather than syncing through an effect.
  return (
    <RunSheet
      key={inspection.updatedAt ?? inspection.id}
      inspection={inspection}
    />
  );
}

// ---------------------------------------------------------------------------
// The form
// ---------------------------------------------------------------------------

/**
 * One check point being filled in. It is the request shape the update endpoint
 * wants, plus the stored row id so React keys and validation messages have
 * something stable to hang on.
 */
interface RunItem extends InspectionCheckItemRequest {
  key: string;
}

function toRunItems(inspection: Inspection): RunItem[] {
  return inspection.checkItems.map((item, index) => ({
    key: item.id || `item-${index}`,
    category: item.category,
    checkPoint: item.checkPoint,
    specification: item.specification,
    status: item.status,
    remarks: item.remarks,
    photosRequired: item.photosRequired,
    photos: item.photos,
    measurement: item.measurement,
    expectedValue: item.expectedValue,
    priority: item.priority,
  }));
}

type RunErrors = Record<string, string>;

/**
 * A check point is answerable in one pass, so the only things that can be
 * wrong are leaving it unanswered or failing it without saying why. A failure
 * with no remark gives whoever picks up the NCR nothing to act on.
 */
function validate(items: RunItem[]): RunErrors {
  const errors: RunErrors = {};

  for (const item of items) {
    if (item.status === CheckItemStatus.PENDING) {
      errors[item.key] = 'Record an outcome for this check point.';
    } else if (
      item.status === CheckItemStatus.FAILED &&
      !item.remarks?.trim()
    ) {
      errors[item.key] = 'Say what was wrong before failing this check point.';
    }
  }

  return errors;
}

function RunSheet({ inspection }: { inspection: Inspection }) {
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployeeLookup();
  const updateInspection = useUpdateInspection();

  const [items, setItems] = useState<RunItem[]>(() => toRunItems(inspection));
  const [errors, setErrors] = useState<RunErrors>({});
  const [showErrors, setShowErrors] = useState(false);

  const readOnly = CLOSED_STATUSES.has(inspection.status);

  const tally = useMemo(() => {
    const counted = {
      passed: 0,
      failed: 0,
      notApplicable: 0,
      pending: 0,
    };

    for (const item of items) {
      switch (item.status) {
        case CheckItemStatus.PASSED: {
          counted.passed += 1;
          break;
        }
        case CheckItemStatus.FAILED: {
          counted.failed += 1;
          break;
        }
        case CheckItemStatus.NOT_APPLICABLE: {
          counted.notApplicable += 1;
          break;
        }
        default: {
          counted.pending += 1;
        }
      }
    }

    return counted;
  }, [items]);

  // Scored from the answers in hand rather than the stored counts, which only
  // catch up on the next save.
  const percentage = compliancePercentage({
    totalCheckPoints: items.length,
    passedCheckPoints: tally.passed,
    failedCheckPoints: tally.failed,
  });

  const answered = items.length - tally.pending;

  const groups = useMemo(() => {
    const byCategory = new Map<string, RunItem[]>();

    for (const item of items) {
      const category = item.category?.trim() || UNGROUPED;
      const bucket = byCategory.get(category);
      if (bucket) bucket.push(item);
      else byCategory.set(category, [item]);
    }

    return [...byCategory.entries()];
  }, [items]);

  const project = projects.find((row) => row.id === inspection.projectId);
  const inspector = employees.find((row) => row.id === inspection.inspectorId);

  const patchItem = (key: string, next: Partial<RunItem>) => {
    setItems((previous) => {
      const updated = previous.map((item) =>
        item.key === key ? { ...item, ...next } : item
      );
      // Re-validate live once the inspector has seen errors, so fixes clear.
      if (showErrors) setErrors(validate(updated));
      return updated;
    });
  };

  // A critical defect fails the inspection whatever the score says. Severity is
  // free text on the backend, so it is matched case-insensitively.
  const criticalDefects = inspection.defects.filter(
    (defect) => defect.severity?.trim().toLowerCase() === 'critical'
  ).length;

  const save = (status: InspectionStatus, conclude: boolean) => {
    if (!inspection.scheduledDate) return;

    const request: UpdateInspectionRequest = {
      title: inspection.title,
      type: inspection.type,
      status,
      result: conclude
        ? resultFromCompliance(percentage, criticalDefects)
        : inspection.result,
      projectId: inspection.projectId,
      location: inspection.location,
      areaInspected: inspection.areaInspected,
      drawingReference: inspection.drawingReference,
      scheduledDate: inspection.scheduledDate,
      scheduledTime: inspection.scheduledTime,
      actualStartTime: inspection.actualStartTime,
      actualEndTime: inspection.actualEndTime,
      duration: inspection.duration,
      // The endpoint insists on an inspector. An AI-generated compliance
      // arrives without one, and the backend represents that as 0, so the same
      // placeholder goes back rather than inventing an employee.
      inspectorId: inspection.inspectorId ?? 0,
      contractorId: inspection.contractorId,
      clientRepresentative: inspection.clientRepresentative,
      attendees: inspection.attendees,
      weatherConditions: inspection.weatherConditions,
      temperature: inspection.temperature,
      checkItems: items.map(({ key: _key, ...item }) => item),
      // PUT replaces the whole inspection, so the defect rows are threaded
      // back through untouched; they are recorded elsewhere, not here.
      defects: inspection.defects.map((defect) => ({
        category: defect.category,
        description: defect.description,
        severity: defect.severity,
        location: defect.location,
        photos: defect.photos,
        correctiveAction: defect.correctiveAction,
        responsibleParty: defect.responsibleParty,
        targetDate: defect.targetDate,
        status: defect.status,
        resolvedDate: defect.resolvedDate,
      })),
    };

    updateInspection.mutate(
      { id: inspection.id, req: request },
      {
        onSuccess: () => {
          toast.success(
            conclude ? 'Inspection completed' : 'Progress saved'
          );
        },
        onError: (error) => {
          toast.error(getErrorTitle(error, 'Could not save the inspection'), {
            description: getErrorMessage(error),
          });
        },
      }
    );
  };

  const handleSaveProgress = () => {
    // Saving part-way through is what moves a scheduled inspection into
    // progress; a later save should not drag it backwards.
    save(
      inspection.status === InspectionStatus.SCHEDULED
        ? InspectionStatus.IN_PROGRESS
        : inspection.status,
      false
    );
  };

  const handleComplete = () => {
    const found = validate(items);
    setErrors(found);
    setShowErrors(true);

    if (Object.keys(found).length > 0) return;

    save(InspectionStatus.COMPLETED, true);
  };

  const errorCount = Object.keys(errors).length;
  const canSave = Boolean(inspection.scheduledDate);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={inspection.title}
        description={inspection.inspectionNumber}
        badge={<InspectionTypeBadge type={inspection.type} />}
        actions={
          readOnly ? undefined : (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={!canSave || updateInspection.isPending}
                onClick={handleSaveProgress}
              >
                <Save className="size-4" />
                Save progress
              </Button>
              <Button
                disabled={!canSave || updateInspection.isPending}
                onClick={handleComplete}
              >
                <Send className="size-4" />
                Complete inspection
              </Button>
            </div>
          )
        }
      />

      <Card className="gap-0 p-0">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 sm:grid-cols-4">
          <Meta label="Project">
            {project?.projectName ?? 'Not assigned'}
          </Meta>
          <Meta label="Inspector">{inspector?.name ?? 'Not assigned'}</Meta>
          <Meta label="Scheduled">
            {inspection.scheduledDate
              ? format(new Date(inspection.scheduledDate), 'dd MMM yyyy')
              : 'Not scheduled'}
          </Meta>
          <Meta label="Location">
            {inspection.location ?? 'Not specified'}
          </Meta>
        </dl>
        <Separator />
        <div className="flex flex-wrap items-center gap-3 px-5 py-3">
          <InspectionStatusBadge status={inspection.status} />
          <InspectionResultBadge result={inspection.result} />
          {items.length > 0 && (
            <span className="text-muted-foreground ml-auto text-sm tabular-nums">
              Compliance{' '}
              <span className="text-foreground font-semibold">
                {percentage}%
              </span>{' '}
              ({tally.passed} pass / {tally.failed} fail
              {tally.notApplicable > 0 && ` / ${tally.notApplicable} N/A`})
            </span>
          )}
        </div>
      </Card>

      {items.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground tabular-nums">
              {answered} of {items.length}
            </span>
          </div>
          <Progress
            value={
              items.length === 0 ? 0 : Math.round((answered / items.length) * 100)
            }
          />
        </div>
      )}

      {!canSave && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>This inspection has no scheduled date</AlertTitle>
          <AlertDescription>
            Set one from the edit page before recording results, since the
            inspection cannot be saved without it.
          </AlertDescription>
        </Alert>
      )}

      {showErrors && errorCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>
            {errorCount} {errorCount === 1 ? 'check point needs' : 'check points need'}{' '}
            attention
          </AlertTitle>
          <AlertDescription>
            Fix the highlighted items below, then complete the inspection again.
          </AlertDescription>
        </Alert>
      )}

      {readOnly && (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>This inspection is closed</AlertTitle>
          <AlertDescription>
            Its check points are read-only. Raise an NCR to record follow-up
            work.
          </AlertDescription>
        </Alert>
      )}

      {items.length === 0 ? (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>No check points yet</AlertTitle>
          <AlertDescription>
            Add them from the edit page, then come back to record the outcome of
            each one.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {groups.map(([category, groupItems]) => (
            <CheckGroup
              key={category}
              category={category}
              items={groupItems}
              errors={showErrors ? errors : {}}
              disabled={readOnly}
              inspectionId={inspection.id}
              onPatch={patchItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Groups and rows
// ---------------------------------------------------------------------------

interface CheckGroupProps {
  category: string;
  items: RunItem[];
  errors: RunErrors;
  disabled: boolean;
  inspectionId: string;
  onPatch: (key: string, next: Partial<RunItem>) => void;
}

function CheckGroup({
  category,
  items,
  errors,
  disabled,
  inspectionId,
  onPatch,
}: CheckGroupProps) {
  const [open, setOpen] = useState(true);

  const errorCount = items.filter((item) => errors[item.key]).length;

  // A collapsed group hides its rows entirely, so a flagged check point inside
  // one would make "fix the highlighted items below" point at nothing.
  //
  // Adjusted during render rather than in an effect: React re-runs this
  // component before committing, so the group is already open on the paint that
  // first shows the errors. Reopening on the transition leaves the toggle
  // honest, so the inspector can collapse it again once they have seen what is
  // wrong.
  const [lastErrorCount, setLastErrorCount] = useState(errorCount);
  if (errorCount !== lastErrorCount) {
    setLastErrorCount(errorCount);
    if (errorCount > 0) setOpen(true);
  }

  const answered = items.filter(
    (item) => item.status !== CheckItemStatus.PENDING
  ).length;

  return (
    <Card className="gap-0 p-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className="hover:bg-muted/50 flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors"
      >
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{category}</h3>
          <p className="text-muted-foreground text-xs tabular-nums">
            {answered} of {items.length} recorded
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {errorCount > 0 && (
            <Badge variant="destructive">
              {errorCount} {errorCount === 1 ? 'issue' : 'issues'}
            </Badge>
          )}
          <ChevronDown
            className={cn(
              'text-muted-foreground size-4 transition-transform',
              open && 'rotate-180'
            )}
          />
        </div>
      </button>

      {open && (
        <>
          <Separator />
          <div className="divide-border divide-y">
            {items.map((item) => (
              <CheckRow
                key={item.key}
                item={item}
                error={errors[item.key]}
                disabled={disabled}
                inspectionId={inspectionId}
                onPatch={onPatch}
              />
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

interface CheckRowProps {
  item: RunItem;
  error?: string;
  disabled: boolean;
  inspectionId: string;
  onPatch: (key: string, next: Partial<RunItem>) => void;
}

function CheckRow({
  item,
  error,
  disabled,
  inspectionId,
  onPatch,
}: CheckRowProps) {
  const failed = item.status === CheckItemStatus.FAILED;

  return (
    <div className={cn('space-y-3 px-5 py-4', error && 'bg-destructive/5')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">{item.checkPoint}</p>
          {item.specification && (
            <p className="text-muted-foreground text-xs">
              {item.specification}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            {item.priority && (
              <Badge variant="outline">{item.priority}</Badge>
            )}
            {item.photosRequired && (
              <Badge variant="secondary">Photo evidence required</Badge>
            )}
            {(item.photos?.length ?? 0) > 0 && (
              <span className="text-muted-foreground text-xs tabular-nums">
                {item.photos?.length} attached
              </span>
            )}
          </div>
        </div>

        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={item.status}
          disabled={disabled}
          // Radix reports an empty string when the pressed option is toggled
          // off; an outcome is cleared by choosing another one, not by
          // un-pressing, so that case is ignored.
          onValueChange={(value) =>
            value && onPatch(item.key, { status: value as CheckItemStatus })
          }
        >
          {OUTCOMES.map((status) => (
            <ToggleGroupItem
              key={status}
              value={status}
              aria-label={checkItemStatusLabels[status]}
            >
              {checkItemStatusLabels[status]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* A check point only carries a measurement when it was specified with an
          expected value, so the field appears only where one is meaningful. */}
      {item.expectedValue && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`measurement-${item.key}`} className="text-xs">
              Measured
            </Label>
            <Input
              id={`measurement-${item.key}`}
              value={item.measurement ?? ''}
              disabled={disabled}
              placeholder={item.expectedValue}
              onChange={(event) =>
                onPatch(item.key, { measurement: event.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Expected</Label>
            <p className="text-muted-foreground pt-2 text-sm">
              {item.expectedValue}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`remarks-${item.key}`} className="text-xs">
          Remarks
        </Label>
        <Textarea
          id={`remarks-${item.key}`}
          rows={2}
          value={item.remarks ?? ''}
          disabled={disabled}
          placeholder={
            failed ? 'What was wrong, and where' : 'Anything worth noting'
          }
          onChange={(event) =>
            onPatch(item.key, { remarks: event.target.value })
          }
        />
      </div>

      {error && <p className="text-destructive text-xs">{error}</p>}

      {/* Offered the moment an item is failed: the point of failure is when the
          inspector has the context and the camera in hand. */}
      {failed && !disabled && (
        <CreateNcrDialog
          inspectionId={inspectionId}
          trigger={
            <Button variant="outline" size="sm" className="text-destructive">
              Raise NCR for this check point
            </Button>
          }
        />
      )}
    </div>
  );
}

/** The outcomes an inspector picks from; PENDING is the unanswered state. */
const OUTCOMES: CheckItemStatus[] = [
  CheckItemStatus.PASSED,
  CheckItemStatus.FAILED,
  CheckItemStatus.NOT_APPLICABLE,
];

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
      <dd className="truncate text-sm font-medium">{children}</dd>
    </div>
  );
}

function RuntimeSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
