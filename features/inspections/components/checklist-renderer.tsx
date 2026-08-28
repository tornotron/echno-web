'use client';

/**
 * Renders a checklist schema as a normal application form.
 *
 * This is the schema-driven view used by the template builder's preview, so an
 * author sees the shape they are editing rather than a summary of it. A live
 * inspection is not filled in here: its answers are the inspection's own check
 * items, which have no schema, and are recorded by {@link InspectionRuntime}.
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty';
import { cn } from '@/lib/utils/index';
import {
  type ChecklistElement,
  type ChecklistErrors,
  type ChecklistResponses,
  type ChecklistSchema,
  type ResponseValue,
  checklistProgress,
  isElementVisible,
  subtreeErrorCount,
} from '@/types/inspection';
import { definitionFor } from '../builder/element-registry';

/** Section headers are display-only; the registry contract still wants onChange. */
const noop = () => {
  // Intentionally empty: a section header records no response.
};

interface ChecklistRendererProps {
  schema: ChecklistSchema;
  responses: ChecklistResponses;
  onChange: (elementId: string, value: ResponseValue) => void;
  errors?: ChecklistErrors;
  /** Renders every control inert, for the builder preview. */
  disabled?: boolean;
}

export function ChecklistRenderer({
  schema,
  responses,
  onChange,
  errors = {},
  disabled = false,
}: ChecklistRendererProps) {
  const progress = checklistProgress(schema, responses);

  if (schema.elements.length === 0) {
    return (
      <Empty className="border-muted-foreground/25 rounded-lg border border-dashed">
        <EmptyTitle>Nothing to fill in yet</EmptyTitle>
        <EmptyDescription>
          This checklist has no items. Add elements in the builder first.
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      {schema.settings.showProgress && progress.total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground tabular-nums">
              {progress.answered} of {progress.total}
            </span>
          </div>
          <Progress value={progress.percentage} />
        </div>
      )}

      <div className="space-y-4">
        {schema.elements.map((element) => (
          <RenderedNode
            key={element.id}
            element={element}
            responses={responses}
            onChange={onChange}
            errors={errors}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

interface RenderedNodeProps {
  element: ChecklistElement;
  responses: ChecklistResponses;
  onChange: (elementId: string, value: ResponseValue) => void;
  errors: ChecklistErrors;
  disabled: boolean;
}

function RenderedNode(props: RenderedNodeProps) {
  const { element, responses } = props;

  // A hidden element hides its whole subtree.
  if (!isElementVisible(element, responses)) return null;

  return element.type === 'section' ? (
    <RenderedSection {...props} />
  ) : (
    <RenderedField {...props} />
  );
}

function RenderedField({
  element,
  responses,
  onChange,
  errors,
  disabled,
}: RenderedNodeProps) {
  const { Field } = definitionFor(element.type);
  const value = responses[element.id];

  return (
    <Field
      element={element}
      value={value}
      error={errors[element.id]}
      disabled={disabled}
      onChange={(nextValue) => onChange(element.id, nextValue)}
    />
  );
}

function RenderedSection(props: RenderedNodeProps) {
  const { element, errors } = props;
  const [open, setOpen] = useState(!element.collapsible);
  const { Field } = definitionFor('section');

  const errorCount = subtreeErrorCount(element, errors);

  // A collapsed section hides its children entirely, so a failing field inside
  // one would make "fix the highlighted items below" point at nothing.
  //
  // Adjusted during render rather than in an effect: React re-runs this
  // component before committing, so the section is already open on the paint
  // that first shows the errors, so there is no flash of a collapsed section and no
  // cascading render. Opening on the *transition* leaves the toggle honest, so
  // the inspector can collapse it again once they have seen what is wrong.
  const [lastErrorCount, setLastErrorCount] = useState(errorCount);
  if (errorCount !== lastErrorCount) {
    setLastErrorCount(errorCount);
    if (errorCount > 0) setOpen(true);
  }

  const header = (
    <Field element={element} value={undefined} disabled onChange={noop} />
  );

  return (
    <Card className="p-0">
      {element.collapsible ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((previous) => !previous)}
          className="hover:bg-muted/50 flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors"
        >
          {header}
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
      ) : (
        <div className="px-5 py-4">{header}</div>
      )}

      {open && (element.children?.length ?? 0) > 0 && (
        <>
          <Separator />
          <div className="space-y-5 px-5 py-5">
            {element.children?.map((child) => (
              <RenderedNode key={child.id} {...props} element={child} />
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
