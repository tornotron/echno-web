'use client';

/**
 * Element renderers.
 *
 * One component per element type, shared by the builder canvas (`disabled`),
 * the preview and the live runtime — so a checklist can never look different
 * between where it is authored and where it is filled in.
 *
 * Only the element types a stored template can represent live here; see the
 * registry and `types/inspection/template-schema-adapter.ts` for why the rest
 * were dropped.
 */

import { Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils/index';
import type { ElementFieldProps } from './types';

// ---------------------------------------------------------------------------
// Shared chrome
// ---------------------------------------------------------------------------

/** Label, description and error text around a control. */
export function FieldShell({
  element,
  error,
  children,
  inline = false,
}: Pick<ElementFieldProps, 'element' | 'error'> & {
  children: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <div className="space-y-2">
      {!inline && (
        <div className="space-y-0.5">
          <Label htmlFor={element.id} className="text-sm font-medium">
            {element.label}
            {element.required && (
              <span className="text-destructive ml-0.5" aria-hidden>
                *
              </span>
            )}
          </Label>
          {element.description && (
            <p className="text-muted-foreground text-xs">
              {element.description}
            </p>
          )}
        </div>
      )}
      {children}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Basic inputs
// ---------------------------------------------------------------------------

export function TextField({
  element,
  value,
  onChange,
  disabled,
  error,
}: ElementFieldProps) {
  return (
    <FieldShell element={element} error={error}>
      <Input
        id={element.id}
        value={String(value ?? '')}
        placeholder={element.placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

export function TextareaField({
  element,
  value,
  onChange,
  disabled,
  error,
}: ElementFieldProps) {
  return (
    <FieldShell element={element} error={error}>
      <Textarea
        id={element.id}
        rows={3}
        value={String(value ?? '')}
        placeholder={element.placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

export function NumberField({
  element,
  value,
  onChange,
  disabled,
  error,
}: ElementFieldProps) {
  return (
    <FieldShell element={element} error={error}>
      <Input
        id={element.id}
        type="number"
        value={value === undefined || value === null ? '' : String(value)}
        placeholder={element.placeholder}
        min={element.validation?.min}
        max={element.validation?.max}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) =>
          onChange(
            event.target.value === '' ? undefined : Number(event.target.value)
          )
        }
      />
    </FieldShell>
  );
}

export function SelectField({
  element,
  value,
  onChange,
  disabled,
  error,
}: ElementFieldProps) {
  return (
    <FieldShell element={element} error={error}>
      <Select
        value={String(value ?? '')}
        disabled={disabled}
        onValueChange={onChange}
      >
        <SelectTrigger
          id={element.id}
          className="w-full"
          aria-invalid={Boolean(error)}
        >
          <SelectValue placeholder={element.placeholder ?? 'Select…'} />
        </SelectTrigger>
        <SelectContent>
          {(element.options ?? []).map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

export function RadioField({
  element,
  value,
  onChange,
  disabled,
  error,
}: ElementFieldProps) {
  return (
    <FieldShell element={element} error={error}>
      <RadioGroup
        value={String(value ?? '')}
        disabled={disabled}
        onValueChange={onChange}
        className="gap-2"
      >
        {(element.options ?? []).map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <RadioGroupItem
              value={option.value}
              id={`${element.id}-${option.value}`}
            />
            <Label
              htmlFor={`${element.id}-${option.value}`}
              className="text-sm font-normal"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </FieldShell>
  );
}

// ---------------------------------------------------------------------------
// Inspection-specific
// ---------------------------------------------------------------------------

/** Segmented choice rendered as buttons — the fastest control on site. */
function SegmentedField({
  element,
  value,
  onChange,
  disabled,
  error,
  choices,
}: ElementFieldProps & {
  choices: { value: string; label: string; activeClass: string }[];
}) {
  return (
    <FieldShell element={element} error={error}>
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => {
          const active = value === choice.value;
          return (
            <Button
              key={choice.value}
              type="button"
              variant={active ? 'default' : 'outline'}
              size="sm"
              disabled={disabled}
              aria-pressed={active}
              className={cn('min-w-20', active && choice.activeClass)}
              onClick={() => onChange(active ? undefined : choice.value)}
            >
              {choice.label}
            </Button>
          );
        })}
      </div>
    </FieldShell>
  );
}

const PASS_FAIL_CHOICES = [
  {
    value: 'PASS',
    label: 'Pass',
    activeClass: 'bg-emerald-600 hover:bg-emerald-600/90 text-white',
  },
  {
    value: 'FAIL',
    label: 'Fail',
    activeClass: 'bg-red-600 hover:bg-red-600/90 text-white',
  },
];

const YES_NO_NA_CHOICES = [
  {
    value: 'YES',
    label: 'Yes',
    activeClass: 'bg-emerald-600 hover:bg-emerald-600/90 text-white',
  },
  {
    value: 'NO',
    label: 'No',
    activeClass: 'bg-red-600 hover:bg-red-600/90 text-white',
  },
  { value: 'NA', label: 'N/A', activeClass: '' },
];

export function PassFailField(props: ElementFieldProps) {
  return <SegmentedField {...props} choices={PASS_FAIL_CHOICES} />;
}

export function YesNoNaField(props: ElementFieldProps) {
  return <SegmentedField {...props} choices={YES_NO_NA_CHOICES} />;
}

export function CommentField(props: ElementFieldProps) {
  return <TextareaField {...props} />;
}

/**
 * Photo capture placeholder.
 *
 * A template can require photo evidence on a check point, but there is no
 * inspection attachment endpoint to upload against yet, so the control says
 * so rather than pretending to work. The value contract is a list of stored
 * file references, so wiring it up later is a swap of this one component.
 */
export function PhotoField({
  element,
  value,
  disabled,
  error,
}: ElementFieldProps) {
  const count = Array.isArray(value) ? value.length : 0;

  let caption = 'Photo upload is not connected yet';
  if (disabled) caption = 'Photo upload';
  else if (count > 0)
    caption = `${count} photo${count === 1 ? '' : 's'} attached`;

  return (
    <FieldShell element={element} error={error}>
      <div className="border-muted-foreground/25 flex flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center">
        <Upload className="text-muted-foreground size-5" />
        <p className="text-muted-foreground text-xs">{caption}</p>
        <p className="text-muted-foreground/70 text-[11px]">JPG, PNG, HEIC</p>
      </div>
    </FieldShell>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function HeadingField({ element }: ElementFieldProps) {
  return (
    <div className="space-y-0.5">
      <h3 className="text-base font-semibold">{element.label}</h3>
      {element.description && (
        <p className="text-muted-foreground text-sm">{element.description}</p>
      )}
    </div>
  );
}

/**
 * Sections render their own header only — children are laid out by the
 * canvas and the runtime renderer, which own drag targets and response state.
 */
export function SectionField({ element }: ElementFieldProps) {
  return (
    <div className="space-y-0.5">
      <h3 className="text-sm font-semibold tracking-wide uppercase">
        {element.label}
      </h3>
      {element.description && (
        <p className="text-muted-foreground text-xs">{element.description}</p>
      )}
    </div>
  );
}
