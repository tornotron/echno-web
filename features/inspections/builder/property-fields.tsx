'use client';

/**
 * Composable fragments for the properties panel.
 *
 * Each element's `Properties` component picks the fragments it needs, which
 * keeps per-element editors to a few lines and avoids one giant switch.
 */

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import { Switch } from '@/components/shadcn/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  type ChecklistElement,
  type ConditionOperator,
  type ElementOption,
  CONDITION_OPERATORS,
} from '@/types/inspection';
import type { ElementPropertiesProps } from './types';

// ---------------------------------------------------------------------------
// Layout helper
// ---------------------------------------------------------------------------

export function PropertyGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 border-b px-4 py-4 last:border-b-0">
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fragments
// ---------------------------------------------------------------------------

/** Label + description — used by every element type. */
export function LabelFields({
  element,
  onChange,
  labelText = 'Label',
}: Pick<ElementPropertiesProps, 'element' | 'onChange'> & {
  labelText?: string;
}) {
  return (
    <PropertyGroup title="Content">
      <Row label={labelText} htmlFor="prop-label">
        <Input
          id="prop-label"
          value={element.label}
          onChange={(event) => onChange({ label: event.target.value })}
        />
      </Row>
      <Row label="Description" htmlFor="prop-description">
        <Textarea
          id="prop-description"
          rows={2}
          value={element.description ?? ''}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </Row>
    </PropertyGroup>
  );
}

export function PlaceholderField({
  element,
  onChange,
}: Pick<ElementPropertiesProps, 'element' | 'onChange'>) {
  return (
    <Row label="Placeholder" htmlFor="prop-placeholder">
      <Input
        id="prop-placeholder"
        value={element.placeholder ?? ''}
        onChange={(event) => onChange({ placeholder: event.target.value })}
      />
    </Row>
  );
}

export function RequiredToggle({
  element,
  onChange,
}: Pick<ElementPropertiesProps, 'element' | 'onChange'>) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor="prop-required" className="text-xs font-medium">
        Required
      </Label>
      <Switch
        id="prop-required"
        checked={element.required ?? false}
        onCheckedChange={(checked) => onChange({ required: checked })}
      />
    </div>
  );
}

/** Numeric min/max — only meaningful for `number` and `rating`. */
export function NumericValidation({
  element,
  onChange,
}: Pick<ElementPropertiesProps, 'element' | 'onChange'>) {
  const validation = element.validation ?? {};

  const patch = (key: 'min' | 'max', raw: string) =>
    onChange({
      validation: {
        ...validation,
        [key]: raw === '' ? undefined : Number(raw),
      },
    });

  return (
    <div className="grid grid-cols-2 gap-2">
      <Row label="Min" htmlFor="prop-min">
        <Input
          id="prop-min"
          type="number"
          value={validation.min ?? ''}
          onChange={(event) => patch('min', event.target.value)}
        />
      </Row>
      <Row label="Max" htmlFor="prop-max">
        <Input
          id="prop-max"
          type="number"
          value={validation.max ?? ''}
          onChange={(event) => patch('max', event.target.value)}
        />
      </Row>
    </div>
  );
}

export function TextValidation({
  element,
  onChange,
}: Pick<ElementPropertiesProps, 'element' | 'onChange'>) {
  const validation = element.validation ?? {};

  const patch = (key: 'minLength' | 'maxLength', raw: string) =>
    onChange({
      validation: {
        ...validation,
        [key]: raw === '' ? undefined : Number(raw),
      },
    });

  return (
    <div className="grid grid-cols-2 gap-2">
      <Row label="Min length" htmlFor="prop-minlen">
        <Input
          id="prop-minlen"
          type="number"
          value={validation.minLength ?? ''}
          onChange={(event) => patch('minLength', event.target.value)}
        />
      </Row>
      <Row label="Max length" htmlFor="prop-maxlen">
        <Input
          id="prop-maxlen"
          type="number"
          value={validation.maxLength ?? ''}
          onChange={(event) => patch('maxLength', event.target.value)}
        />
      </Row>
    </div>
  );
}

/** Option list editor for select / radio / multiselect. */
export function OptionsEditor({
  element,
  onChange,
}: Pick<ElementPropertiesProps, 'element' | 'onChange'>) {
  const options = element.options ?? [];

  const update = (next: ElementOption[]) => onChange({ options: next });

  const setLabel = (index: number, label: string) => {
    const next = [...options];
    // Value tracks the label until the author has a reason to diverge; keeping
    // them in sync avoids orphaning saved responses on a typo fix.
    next[index] = { ...next[index], label, value: label };
    update(next);
  };

  return (
    <PropertyGroup title="Options">
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={option.label}
              placeholder={`Option ${index + 1}`}
              onChange={(event) => setLabel(index, event.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove option ${index + 1}`}
              onClick={() => update(options.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() =>
          update([
            ...options,
            {
              label: `Option ${options.length + 1}`,
              value: `Option ${options.length + 1}`,
            },
          ])
        }
      >
        <Plus className="size-4" />
        Add option
      </Button>
    </PropertyGroup>
  );
}

// ---------------------------------------------------------------------------
// Conditional visibility
// ---------------------------------------------------------------------------

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: 'equals',
  notEquals: 'does not equal',
  contains: 'contains',
  isEmpty: 'is empty',
  isNotEmpty: 'is not empty',
};

const VALUELESS_OPERATORS = new Set<ConditionOperator>([
  'isEmpty',
  'isNotEmpty',
]);

/**
 * Single-condition visibility editor.
 *
 * The schema supports several conditions with all/any matching; this UI
 * authors the first one, which covers the common case without committing us
 * to a rule-builder before it is needed.
 */
export function VisibilityEditor({
  element,
  onChange,
  availableConditionSources,
}: ElementPropertiesProps) {
  const condition = element.visibility?.when[0];
  const enabled = Boolean(condition);

  const setCondition = (patch: Partial<NonNullable<typeof condition>>) => {
    const base = condition ?? {
      element: availableConditionSources[0]?.id ?? '',
      operator: 'equals' as ConditionOperator,
      value: '',
    };
    onChange({ visibility: { match: 'all', when: [{ ...base, ...patch }] } });
  };

  return (
    <PropertyGroup title="Conditional logic">
      <div className="flex items-center justify-between">
        <Label htmlFor="prop-conditional" className="text-xs font-medium">
          Only show when…
        </Label>
        <Switch
          id="prop-conditional"
          disabled={availableConditionSources.length === 0}
          checked={enabled}
          onCheckedChange={(checked) =>
            checked ? setCondition({}) : onChange({ visibility: undefined })
          }
        />
      </div>

      {availableConditionSources.length === 0 && (
        <p className="text-muted-foreground text-xs">
          Add another field above this one to use it as a condition.
        </p>
      )}

      {enabled && condition && (
        <div className="space-y-2">
          <Select
            value={condition.element}
            onValueChange={(value) => setCondition({ element: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {availableConditionSources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={condition.operator}
            onValueChange={(value) =>
              setCondition({ operator: value as ConditionOperator })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_OPERATORS.map((operator) => (
                <SelectItem key={operator} value={operator}>
                  {OPERATOR_LABELS[operator]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!VALUELESS_OPERATORS.has(condition.operator) && (
            <Input
              value={String(condition.value ?? '')}
              placeholder="Value"
              onChange={(event) => setCondition({ value: event.target.value })}
            />
          )}
        </div>
      )}
    </PropertyGroup>
  );
}

// ---------------------------------------------------------------------------
// Composed default editor
// ---------------------------------------------------------------------------

/** Label + required + conditional logic — the shape most elements need. */
export function StandardProperties({
  extras,
  ...props
}: ElementPropertiesProps & { extras?: React.ReactNode }) {
  return (
    <>
      <LabelFields element={props.element} onChange={props.onChange} />
      <PropertyGroup title="Behaviour">
        <RequiredToggle element={props.element} onChange={props.onChange} />
        {extras}
      </PropertyGroup>
      <VisibilityEditor {...props} />
    </>
  );
}

/** Section / heading / divider — no response, so no required or logic. */
export function LayoutProperties({
  element,
  onChange,
  extras,
}: Pick<ElementPropertiesProps, 'element' | 'onChange'> & {
  extras?: React.ReactNode;
}) {
  return (
    <>
      <LabelFields element={element} onChange={onChange} labelText="Title" />
      {extras ? (
        <PropertyGroup title="Behaviour">{extras}</PropertyGroup>
      ) : null}
    </>
  );
}

export function elementIsBlank(element: ChecklistElement): boolean {
  return element.label.trim() === '';
}
