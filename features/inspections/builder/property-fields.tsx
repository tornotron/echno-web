'use client';

/**
 * Composable fragments for the properties panel.
 *
 * Each element's `Properties` component picks the fragments it needs, which
 * keeps per-element editors to a few lines and avoids one giant switch.
 *
 * Only properties that survive a template save are authorable here. A stored
 * ChecklistTemplate is a flat list of check points (see
 * `types/inspection/template-schema-adapter.ts`), so conditional visibility,
 * per-option scores, placeholders and text-length limits have nowhere to
 * land. Offering an editor for them would let an author spend time on
 * settings the next save silently drops.
 */

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { ChecklistElement, ElementOption } from '@/types/inspection';
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

/**
 * Numeric min/max, the one validation a stored template keeps: the adapter
 * writes it out as the check point's tolerance in words.
 */
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

/**
 * Option list editor for select and radio.
 *
 * Labels only. `ElementOption` also carries a `score`, but the stored template
 * has no column for a per-option weight, so authoring one here would be work
 * thrown away on the next save.
 */
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
// Composed default editor
// ---------------------------------------------------------------------------

/** Label, description and required: the shape most elements need. */
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
    </>
  );
}

/** Section and heading. Neither captures a response, so nothing to require. */
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
