'use client';

/**
 * The live inspection page — a normal application form, not the builder.
 *
 * Renders the checklist version pinned to the inspection through the shared
 * {@link ChecklistRenderer}, so what the inspector fills in is exactly what
 * the author saw in preview.
 */

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { AlertCircle, Save, Send } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import { Skeleton } from '@/components/shadcn/skeleton';
import { Separator } from '@/components/shadcn/separator';
import {
  useInspection,
  useInspectionChecklist,
  useInspectionNcrDefects,
  useInspectionSubmission,
  useSaveSubmission,
} from '@/hooks/inspection';
import {
  type ChecklistErrors,
  type ChecklistResponses,
  type ChecklistElement,
  type ResponseValue,
  InspectionStatus,
  SubmissionStatus,
  scoreChecklist,
  validateChecklist,
} from '@/types/inspection';
import { ChecklistRenderer } from './checklist-renderer';
import {
  InspectionResultBadge,
  InspectionStatusBadge,
  InspectionTypeBadge,
} from './inspection-badges';
import { CreateNcrDialog } from './create-ncr-dialog';
import { LinkedNcrList } from './linked-ncr-list';
import { ReferenceDocuments } from './reference-documents';

export function InspectionRuntime({ inspectionId }: { inspectionId: number }) {
  const { data: inspection, isLoading } = useInspection(inspectionId);
  const { data: checklist, isLoading: isChecklistLoading } =
    useInspectionChecklist(inspectionId);
  const { data: submission, isLoading: isSubmissionLoading } =
    useInspectionSubmission(inspectionId);

  if (isLoading || isChecklistLoading || isSubmissionLoading)
    return <RuntimeSkeleton />;

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

  // Keyed on the saved submission so the form remounts (and re-seeds its
  // responses) if a different draft arrives, instead of syncing via an effect.
  return (
    <InspectionForm
      key={submission?.id ?? 'new'}
      inspection={inspection}
      checklist={checklist}
      submission={submission ?? undefined}
    />
  );
}

interface InspectionFormProps {
  inspection: NonNullable<ReturnType<typeof useInspection>['data']>;
  checklist?: ReturnType<typeof useInspectionChecklist>['data'];
  submission?: NonNullable<ReturnType<typeof useInspectionSubmission>['data']>;
}

function InspectionForm({
  inspection,
  checklist,
  submission,
}: InspectionFormProps) {
  const inspectionId = inspection.id;
  const saveSubmission = useSaveSubmission();
  const { data: linkedDefects = [] } = useInspectionNcrDefects(inspectionId);

  const [responses, setResponses] = useState<ChecklistResponses>(
    submission?.responses ?? {}
  );
  const [errors, setErrors] = useState<ChecklistErrors>({});
  const [showErrors, setShowErrors] = useState(false);

  const schema = checklist?.schema;

  const score = useMemo(
    () => (schema ? scoreChecklist(schema, responses) : undefined),
    [schema, responses]
  );

  // Checklist items that already have an NCR, so the inline action does not
  // invite a duplicate for the same failure.
  const raisedElementIds = useMemo(
    () =>
      new Set(
        linkedDefects
          .map((defect) => defect.checklistElementId)
          .filter(Boolean) as string[]
      ),
    [linkedDefects]
  );

  const handleChange = (elementId: string, value: ResponseValue) => {
    setResponses((previous) => {
      const next = { ...previous, [elementId]: value };
      // Re-validate live once the inspector has seen errors, so fixes clear.
      if (showErrors && schema) setErrors(validateChecklist(schema, next));
      return next;
    });
  };

  const handleSaveDraft = () => {
    saveSubmission.mutate({
      id: inspectionId,
      dto: {
        responses,
        status: SubmissionStatus.draft,
        compliancePercentage: score?.compliancePercentage,
      },
    });
  };

  const handleSubmit = () => {
    if (!schema) return;

    const found = validateChecklist(schema, responses);
    setErrors(found);
    setShowErrors(true);

    if (Object.keys(found).length > 0) return;

    saveSubmission.mutate({
      id: inspectionId,
      dto: {
        responses,
        status: SubmissionStatus.submitted,
        compliancePercentage: score?.compliancePercentage,
      },
    });
  };

  const isSubmitted =
    submission?.status === SubmissionStatus.submitted ||
    inspection.status === InspectionStatus.completed;

  const errorCount = Object.keys(errors).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={inspection.title}
        description={inspection.description}
        badge={<InspectionTypeBadge type={inspection.type} />}
        actions={
          <div className="flex flex-wrap gap-2">
            <CreateNcrDialog
              inspectionId={inspection.id}
              defaultProjectId={inspection.projectId}
              trigger={<Button variant="outline">Raise NCR</Button>}
            />
            {!isSubmitted && schema && (
              <>
                {schema.settings.allowSaveDraft && (
                  <Button
                    variant="outline"
                    disabled={saveSubmission.isPending}
                    onClick={handleSaveDraft}
                  >
                    <Save className="size-4" />
                    Save Draft
                  </Button>
                )}
                <Button
                  disabled={saveSubmission.isPending}
                  onClick={handleSubmit}
                >
                  <Send className="size-4" />
                  Submit Inspection
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        {/* ── Main column ───────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-4 sm:space-y-6">
          {/* ── Inspection meta ─────────────────────────────────────────────── */}
          <Card variant="panel">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 sm:grid-cols-4">
              <Meta label="Project">
                {inspection.projectName ?? `#${inspection.projectId}`}
              </Meta>
              <Meta label="Inspector">{inspection.inspectorName ?? '—'}</Meta>
              <Meta label="Date">
                {format(inspection.inspectionDate, 'dd MMM yyyy')}
              </Meta>
              <Meta label="Location">{inspection.location ?? '—'}</Meta>
            </dl>
            <Separator />
            <div className="flex flex-wrap items-center gap-3 px-5 py-3">
              <InspectionStatusBadge status={inspection.status} />
              <InspectionResultBadge result={inspection.result} />
              {checklist && (
                <span className="text-muted-foreground text-xs">
                  Checklist v{checklist.version}
                </span>
              )}
              {score && score.scorable > 0 && (
                <span className="text-muted-foreground ml-auto text-sm tabular-nums">
                  Compliance{' '}
                  <span className="text-foreground font-semibold">
                    {score.compliancePercentage}%
                  </span>{' '}
                  ({score.passed} pass / {score.failed} fail
                  {score.notApplicable > 0 && ` / ${score.notApplicable} N/A`})
                </span>
              )}
            </div>
          </Card>

          {showErrors && errorCount > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>
                {errorCount} {errorCount === 1 ? 'field needs' : 'fields need'}{' '}
                attention
              </AlertTitle>
              <AlertDescription>
                Fix the highlighted items below, then submit again.
              </AlertDescription>
            </Alert>
          )}

          {isSubmitted && (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>This inspection has been submitted</AlertTitle>
              <AlertDescription>
                Responses are read-only. Raise an NCR to record follow-up work.
              </AlertDescription>
            </Alert>
          )}

          {/* ── Checklist ───────────────────────────────────────────────────── */}
          {schema ? (
            <ChecklistRenderer
              schema={schema}
              responses={responses}
              errors={showErrors ? errors : {}}
              disabled={isSubmitted}
              onChange={handleChange}
              renderItemAction={(element, value) =>
                isFailedAnswer(value) ? (
                  <RaiseFromItem
                    element={element}
                    inspectionId={inspectionId}
                    projectId={inspection.projectId}
                    raisedIds={raisedElementIds}
                  />
                ) : null
              }
            />
          ) : (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>No checklist attached</AlertTitle>
              <AlertDescription>
                This inspection was created without a checklist template.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/*
          Side column. Sticky on desktop with its own scroll so a drawing stays
          in view while a long checklist is filled in — consulting the spec
          mid-inspection is the normal case, not the exception.
        */}
        <aside className="space-y-4 sm:space-y-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-2">
          <ReferenceDocuments
            inspectionId={inspectionId}
            projectId={inspection.projectId}
            documents={inspection.referenceDocuments}
            disabled={isSubmitted}
          />

          <LinkedNcrList defects={linkedDefects} />
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Raising an NCR from a failed item
// ---------------------------------------------------------------------------

/** Answers that mean the item did not pass, across the scoring element types. */
const FAILED_ANSWERS = new Set(['FAIL', 'NO', 'false']);

function isFailedAnswer(value: ResponseValue): boolean {
  return FAILED_ANSWERS.has(String(value ?? ''));
}

/**
 * Offered inline the moment an item is answered Fail/No — the point of failure
 * is when the inspector has the context and the camera in hand.
 */
function RaiseFromItem({
  element,
  inspectionId,
  projectId,
  raisedIds,
}: {
  element: ChecklistElement;
  inspectionId: number;
  projectId: number;
  raisedIds: Set<string>;
}) {
  if (raisedIds.has(element.id)) {
    return (
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <AlertCircle className="size-3.5" />
        NCR already raised for this item
      </p>
    );
  }

  return (
    <CreateNcrDialog
      inspectionId={inspectionId}
      defaultProjectId={projectId}
      checklistElementId={element.id}
      checklistElementLabel={element.label}
      trigger={
        <Button variant="outline" size="sm" className="text-destructive">
          Raise NCR for this item
        </Button>
      }
    />
  );
}

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
