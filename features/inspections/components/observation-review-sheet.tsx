'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api/api-client';
import {
  CheckItemStatus,
  DefectSeverity,
  ObservationDecision,
  ObservationOutcomeKind,
  ObservationReviewStatus,
  defectSeverityLabels,
  hasObservationChanges,
  isObservationPending,
  observationOutcomeKindLabels,
} from '@tornotron/echno-core/inspection/types';
import type {
  Observation,
  ObservationOutcomeRequest,
  ObservationReviewChanges,
  ReviewObservationRequest,
} from '@tornotron/echno-core/inspection/types';
import { useInspectionById, useReviewObservation } from '@/hooks/inspection';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { RadioGroup, RadioGroupItem } from '@/components/shadcn/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/shadcn/sheet';
import { Textarea } from '@/components/shadcn/textarea';
import { SpatialBreadcrumb } from '@/components/shared/spatial-breadcrumb';
import { SpatialLocationPicker } from '@/components/shared/spatial-location-picker';
import { routes } from '@/nav';
import {
  ObservationConfidence,
  ObservationOutcomeBadge,
  ObservationSourceBadge,
  ObservationStatusBadge,
} from './observation-badges';
import { ObservationEvidenceStrip } from './observation-evidence';

/** What the backend says when a second decision lands on the same row. */
export const ALREADY_DECIDED_MESSAGE =
  'This observation has already been decided. Reopen it to see the decision.';

const NONE = 'NONE';

const checkItemStatusLabel: Partial<Record<CheckItemStatus, string>> = {
  [CheckItemStatus.PASSED]: 'Passed',
  [CheckItemStatus.FAILED]: 'Failed',
  [CheckItemStatus.NOT_APPLICABLE]: 'Not applicable',
};

interface ObservationReviewSheetProps {
  observation: Observation | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Where the decided observation's record lives, for the link shown after
 * the decision. A check item and a defect live on their inspection; an NCR
 * and an inspection have pages of their own.
 */
export function outcomeHref(observation: Observation): string | undefined {
  const { outcomeKind, outcomeRef, inspectionId } = observation;
  switch (outcomeKind) {
    case ObservationOutcomeKind.CHECK_ITEM:
    case ObservationOutcomeKind.DEFECT: {
      return inspectionId
        ? routes.inspections.detail(inspectionId).href
        : undefined;
    }
    case ObservationOutcomeKind.NCR: {
      return outcomeRef
        ? routes.inspections.ncr.detail(outcomeRef).href
        : undefined;
    }
    case ObservationOutcomeKind.INSPECTION: {
      return outcomeRef
        ? routes.inspections.detail(outcomeRef).href
        : undefined;
    }
    default: {
      return undefined;
    }
  }
}

/** Before → after for each field the reviewer touched, ready to show. */
export function pendingDiff(
  observation: Observation,
  changes: ObservationReviewChanges
): { field: string; before: string; after: string }[] {
  const rows: { field: string; before: string; after: string }[] = [];
  const push = (field: string, before: unknown, after: unknown) => {
    if (after === undefined) return;
    const b = before == null ? '' : String(before);
    const a = after == null ? '' : String(after);
    if (a !== b) rows.push({ field, before: b, after: a });
  };
  push('title', observation.title, changes.title);
  push('description', observation.description, changes.description);
  push('category', observation.category, changes.category);
  push('severity', observation.suggestedSeverity, changes.severity);
  push('spatialNodeId', observation.spatialNodeId, changes.spatialNodeId);
  return rows;
}

export function ObservationReviewSheet({
  observation,
  onOpenChange,
}: ObservationReviewSheetProps) {
  return (
    <Sheet open={!!observation} onOpenChange={onOpenChange}>
      {observation && (
        // Keyed on the row so the form state starts fresh for each
        // observation opened, without an effect resetting it.
        <ReviewSheetBody
          key={observation.id}
          observation={observation}
          onOpenChange={onOpenChange}
        />
      )}
    </Sheet>
  );
}

function ReviewSheetBody({
  observation,
  onOpenChange,
}: {
  observation: Observation;
  onOpenChange: (open: boolean) => void;
}) {
  const review = useReviewObservation();
  const [decision, setDecision] = useState<ObservationDecision>(
    ObservationDecision.ACCEPT
  );
  const [note, setNote] = useState('');
  const [edits, setEdits] = useState<ObservationReviewChanges>({});
  const [outcomeKind, setOutcomeKind] = useState<string>(() =>
    observation.outcomeKind === ObservationOutcomeKind.INSPECTION &&
    observation.outcomeRef
      ? ObservationOutcomeKind.INSPECTION
      : NONE
  );
  const [checkItemId, setCheckItemId] = useState<string>('');
  const [checkItemStatus, setCheckItemStatus] = useState<CheckItemStatus>(
    CheckItemStatus.FAILED
  );
  const [defectDescription, setDefectDescription] = useState(
    () => observation.description ?? observation.title
  );
  const [defectAction, setDefectAction] = useState('');
  const [decided, setDecided] = useState<Observation | null>(null);
  const [conflict, setConflict] = useState(false);

  // The inspection an outcome can land on: the observation's own, or for a
  // compliance suggestion the inspection it proposed.
  const targetInspectionId =
    observation.inspectionId ??
    (observation.outcomeKind === ObservationOutcomeKind.INSPECTION
      ? observation.outcomeRef
      : undefined);
  const { data: inspection } = useInspectionById(targetInspectionId ?? '');

  const shown = decided ?? observation;
  const diff = useMemo(
    () => pendingDiff(observation, edits),
    [observation, edits]
  );

  const pending = isObservationPending(shown) && !conflict;
  const isReject = decision === ObservationDecision.REJECT;
  const isModify = decision === ObservationDecision.MODIFY;
  const noteMissing = isReject && note.trim() === '';
  const changesMissing = isModify && !hasObservationChanges(edits);
  const outcomeIncomplete =
    !isReject &&
    ((outcomeKind === ObservationOutcomeKind.CHECK_ITEM && !checkItemId) ||
      (outcomeKind === ObservationOutcomeKind.DEFECT &&
        (!defectDescription.trim() || !defectAction.trim())));
  const canSubmit =
    pending &&
    !noteMissing &&
    !changesMissing &&
    !outcomeIncomplete &&
    !review.isPending;

  const buildOutcome = (): ObservationOutcomeRequest | undefined => {
    switch (outcomeKind) {
      case ObservationOutcomeKind.CHECK_ITEM: {
        return {
          kind: ObservationOutcomeKind.CHECK_ITEM,
          checkItemId,
          status: checkItemStatus,
        };
      }
      case ObservationOutcomeKind.DEFECT: {
        return {
          kind: ObservationOutcomeKind.DEFECT,
          defect: {
            description: defectDescription.trim(),
            correctiveAction: defectAction.trim(),
            severity: edits.severity ?? shown.suggestedSeverity,
            category: edits.category ?? shown.category,
            location: shown.locationNote,
            spatialNodeId: edits.spatialNodeId ?? shown.spatialNodeId ?? null,
          },
        };
      }
      case ObservationOutcomeKind.INSPECTION: {
        return shown.outcomeRef
          ? {
              kind: ObservationOutcomeKind.INSPECTION,
              inspectionId: shown.outcomeRef,
            }
          : { kind: ObservationOutcomeKind.NONE };
      }
      default: {
        return { kind: ObservationOutcomeKind.NONE };
      }
    }
  };

  const submit = async () => {
    const req: ReviewObservationRequest = { decision };
    if (note.trim()) req.note = note.trim();
    if (isModify) req.changes = edits;
    if (!isReject) req.outcome = buildOutcome();
    try {
      const result = await review.mutateAsync({ id: shown.id, req });
      setDecided(result);
      toast.success(
        decision === ObservationDecision.REJECT
          ? 'Observation rejected'
          : decision === ObservationDecision.MODIFY
            ? 'Observation accepted with changes'
            : 'Observation accepted'
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setConflict(true);
        toast.error(ALREADY_DECIDED_MESSAGE);
        return;
      }
      toast.error(
        error instanceof Error
          ? error.message
          : 'The decision could not be saved.'
      );
    }
  };

  const href = outcomeHref(shown);
  const checkItems = inspection?.checkItems ?? [];
  const canCreateDefect = !!targetInspectionId;

  return (
    <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
      <SheetHeader>
        <SheetTitle className="pr-6">{shown.title}</SheetTitle>
        <SheetDescription asChild>
          <div className="flex flex-wrap items-center gap-2">
            <ObservationSourceBadge observation={shown} />
            <ObservationConfidence confidence={shown.confidence} />
            <ObservationStatusBadge status={shown.reviewStatus} />
            <ObservationOutcomeBadge kind={shown.outcomeKind} />
          </div>
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-5 px-4 pb-6">
        <section className="space-y-2 text-sm">
          {shown.description && (
            <p className="whitespace-pre-line">{shown.description}</p>
          )}
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Where</dt>
            <dd>
              <SpatialBreadcrumb
                path={shown.spatialPath}
                fallback={shown.locationNote ?? 'Not given'}
              />
            </dd>
            {shown.category && (
              <>
                <dt className="text-muted-foreground">Category</dt>
                <dd>{shown.category}</dd>
              </>
            )}
            {shown.suggestedSeverity && (
              <>
                <dt className="text-muted-foreground">Suggested severity</dt>
                <dd>{defectSeverityLabels[shown.suggestedSeverity]}</dd>
              </>
            )}
            {shown.observedAt && (
              <>
                <dt className="text-muted-foreground">Observed</dt>
                <dd>
                  {format(new Date(shown.observedAt), 'dd MMM yyyy HH:mm')}
                </dd>
              </>
            )}
            {shown.missionRef && (
              <>
                <dt className="text-muted-foreground">Mission</dt>
                <dd>{shown.missionRef}</dd>
              </>
            )}
          </dl>
          <ObservationEvidenceStrip observation={shown} />
        </section>

        {conflict && (
          <p
            role="alert"
            className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
          >
            {ALREADY_DECIDED_MESSAGE}
          </p>
        )}

        {pending ? (
          <section className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Decision</Label>
              <RadioGroup
                value={decision}
                onValueChange={(value) =>
                  setDecision(value as ObservationDecision)
                }
                className="flex flex-wrap gap-4"
              >
                {(
                  [
                    [ObservationDecision.ACCEPT, 'Accept'],
                    [ObservationDecision.MODIFY, 'Modify'],
                    [ObservationDecision.REJECT, 'Reject'],
                  ] as const
                ).map(([value, label]) => (
                  <div key={value} className="flex items-center gap-2">
                    <RadioGroupItem value={value} id={`decision-${value}`} />
                    <Label htmlFor={`decision-${value}`}>{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {isModify && (
              <div className="space-y-3 rounded-md border p-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={edits.title ?? shown.title}
                    onChange={(e) =>
                      setEdits({ ...edits, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={edits.description ?? shown.description ?? ''}
                    onChange={(e) =>
                      setEdits({ ...edits, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-category">Category</Label>
                    <Input
                      id="edit-category"
                      value={edits.category ?? shown.category ?? ''}
                      onChange={(e) =>
                        setEdits({ ...edits, category: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-severity">Severity</Label>
                    <Select
                      value={edits.severity ?? shown.suggestedSeverity ?? ''}
                      onValueChange={(value) =>
                        setEdits({
                          ...edits,
                          severity: value as DefectSeverity,
                        })
                      }
                    >
                      <SelectTrigger id="edit-severity">
                        <SelectValue placeholder="Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(DefectSeverity).map((value) => (
                          <SelectItem key={value} value={value}>
                            {defectSeverityLabels[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SpatialLocationPicker
                  projectId={shown.projectId}
                  value={edits.spatialNodeId ?? shown.spatialNodeId}
                  onChange={(nodeId) =>
                    setEdits({ ...edits, spatialNodeId: nodeId })
                  }
                />
                {diff.length > 0 ? (
                  <ul className="space-y-1 text-xs" data-testid="review-diff">
                    {diff.map((row) => (
                      <li
                        key={row.field}
                        className="flex flex-wrap items-center gap-1"
                      >
                        <span className="font-medium">{row.field}</span>
                        <span className="text-muted-foreground line-through">
                          {row.before || '(empty)'}
                        </span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{row.after || '(empty)'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Change at least one field to modify.
                  </p>
                )}
              </div>
            )}

            {!isReject && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="outcome-kind">Outcome</Label>
                  <Select value={outcomeKind} onValueChange={setOutcomeKind}>
                    <SelectTrigger id="outcome-kind">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>
                        {
                          observationOutcomeKindLabels[
                            ObservationOutcomeKind.NONE
                          ]
                        }
                      </SelectItem>
                      {checkItems.length > 0 && (
                        <SelectItem value={ObservationOutcomeKind.CHECK_ITEM}>
                          Mark a check item
                        </SelectItem>
                      )}
                      {canCreateDefect && (
                        <SelectItem value={ObservationOutcomeKind.DEFECT}>
                          Create a defect
                        </SelectItem>
                      )}
                      {shown.outcomeKind ===
                        ObservationOutcomeKind.INSPECTION &&
                        shown.outcomeRef && (
                          <SelectItem value={ObservationOutcomeKind.INSPECTION}>
                            Confirm the suggested inspection
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                </div>
                {outcomeKind === ObservationOutcomeKind.CHECK_ITEM && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="outcome-item">Check item</Label>
                      <Select
                        value={checkItemId}
                        onValueChange={setCheckItemId}
                      >
                        <SelectTrigger id="outcome-item">
                          <SelectValue placeholder="Choose an item" />
                        </SelectTrigger>
                        <SelectContent>
                          {checkItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.checkPoint}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="outcome-status">Result</Label>
                      <Select
                        value={checkItemStatus}
                        onValueChange={(value) =>
                          setCheckItemStatus(value as CheckItemStatus)
                        }
                      >
                        <SelectTrigger id="outcome-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            CheckItemStatus.PASSED,
                            CheckItemStatus.FAILED,
                            CheckItemStatus.NOT_APPLICABLE,
                          ].map((value) => (
                            <SelectItem key={value} value={value}>
                              {checkItemStatusLabel[value]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                {outcomeKind === ObservationOutcomeKind.DEFECT && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="defect-description">
                        Defect description
                      </Label>
                      <Textarea
                        id="defect-description"
                        value={defectDescription}
                        onChange={(e) => setDefectDescription(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="defect-action">Corrective action</Label>
                      <Textarea
                        id="defect-action"
                        value={defectAction}
                        onChange={(e) => setDefectAction(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="review-note">
                Note{isReject ? ' (required)' : ''}
              </Label>
              <Textarea
                id="review-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  isReject
                    ? 'Why this is not a finding'
                    : 'Anything worth recording'
                }
              />
              {noteMissing && (
                <p className="text-destructive text-xs">
                  A rejection needs a note saying why.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                onClick={submit}
                disabled={!canSubmit}
                variant={isReject ? 'destructive' : 'default'}
              >
                {isReject
                  ? 'Reject'
                  : isModify
                    ? 'Accept with changes'
                    : 'Accept'}
              </Button>
            </div>
          </section>
        ) : (
          <section className="space-y-3 border-t pt-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Decision</span>
              <ObservationStatusBadge status={shown.reviewStatus} />
              {shown.reviewedAt && (
                <span className="text-muted-foreground text-xs">
                  {format(new Date(shown.reviewedAt), 'dd MMM yyyy HH:mm')}
                </span>
              )}
            </div>
            {shown.reviewNote && (
              <p className="whitespace-pre-line">{shown.reviewNote}</p>
            )}
            {shown.reviewChanges.length > 0 && (
              <ul className="space-y-1 text-xs" data-testid="review-changes">
                {shown.reviewChanges.map((change) => (
                  <li
                    key={change.field}
                    className="flex flex-wrap items-center gap-1"
                  >
                    <span className="font-medium">{change.field}</span>
                    <span className="text-muted-foreground line-through">
                      {change.before == null
                        ? '(empty)'
                        : String(change.before)}
                    </span>
                    <ArrowRight className="h-3 w-3" />
                    <span>
                      {change.after == null ? '(empty)' : String(change.after)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {shown.reviewStatus !== ObservationReviewStatus.REJECTED &&
              shown.outcomeKind !== ObservationOutcomeKind.NONE && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Became</span>
                  <ObservationOutcomeBadge kind={shown.outcomeKind} />
                  {href && (
                    <Button
                      asChild
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                    >
                      <Link href={href} data-testid="outcome-link">
                        Open
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </section>
        )}
      </div>
    </SheetContent>
  );
}
