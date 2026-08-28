'use client';

/**
 * Element renderers.
 *
 * One component per element type, shared by the builder canvas (`disabled`),
 * the preview and the live runtime — so a checklist can never look different
 * between where it is authored and where it is filled in.
 */

import {
  Paperclip,
  PenLine,
  Star,
  Upload,
  Video,
  type LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/shadcn/input';
import { Textarea } from '@/components/shadcn/textarea';
import { Label } from '@/components/shadcn/label';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Separator } from '@/components/shadcn/separator';
import { Button } from '@/components/shadcn/button';
import { RadioGroup, RadioGroupItem } from '@/components/shadcn/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
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

export function DateField({
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
        type="date"
        value={String(value ?? '')}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

export function CheckboxField({
  element,
  value,
  onChange,
  disabled,
  error,
}: ElementFieldProps) {
  return (
    <FieldShell element={element} error={error} inline>
      <div className="flex items-start gap-2.5">
        <Checkbox
          id={element.id}
          checked={value === true}
          disabled={disabled}
          onCheckedChange={(checked) => onChange(checked === true)}
        />
        <div className="space-y-0.5">
          <Label htmlFor={element.id} className="text-sm font-normal">
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
      </div>
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

export function MultiselectField({
  element,
  value,
  onChange,
  disabled,
  error,
}: ElementFieldProps) {
  const selected = Array.isArray(value) ? value : [];

  const toggle = (optionValue: string, checked: boolean) =>
    onChange(
      checked
        ? [...selected, optionValue]
        : selected.filter((item) => item !== optionValue)
    );

  return (
    <FieldShell element={element} error={error}>
      <div className="space-y-2">
        {(element.options ?? []).map((option) => (
          <div key={option.value} className="flex items-center gap-2.5">
            <Checkbox
              id={`${element.id}-${option.value}`}
              checked={selected.includes(option.value)}
              disabled={disabled}
              onCheckedChange={(checked) =>
                toggle(option.value, checked === true)
              }
            />
            <Label
              htmlFor={`${element.id}-${option.value}`}
              className="text-sm font-normal"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
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

export function RatingField({
  element,
  value,
  onChange,
  disabled,
  error,
}: ElementFieldProps) {
  const max = element.validation?.max ?? 5;
  const current = typeof value === 'number' ? value : 0;

  return (
    <FieldShell element={element} error={error}>
      <div className="flex items-center gap-1">
        {Array.from({ length: max }, (_, index) => index + 1).map((score) => (
          <button
            key={score}
            type="button"
            disabled={disabled}
            aria-label={`${score} of ${max}`}
            className="disabled:cursor-not-allowed"
            onClick={() => onChange(current === score ? undefined : score)}
          >
            <Star
              className={cn(
                'size-6 transition-colors',
                score <= current
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/40'
              )}
            />
          </button>
        ))}
      </div>
    </FieldShell>
  );
}

export function CommentField(props: ElementFieldProps) {
  return <TextareaField {...props} />;
}

/**
 * Photo and signature capture are stubbed to the schema contract only.
 * They store a reference string; wiring them to the existing attachment
 * upload flow is a follow-up, so the control states that plainly rather
 * than pretending to work.
 */
interface UploadFieldConfig {
  icon: LucideIcon;
  /** Singular noun used in the caption, e.g. "photo". */
  noun: string;
  /** Accepted-types hint shown under the caption. */
  hint: string;
}

/**
 * Shared capture placeholder for the media/attachment element types.
 *
 * The value contract is a list of stored-file references, so wiring these to
 * the existing attachment upload flow later is a swap of this one component.
 */
function UploadField({
  element,
  value,
  disabled,
  error,
  config,
}: ElementFieldProps & { config: UploadFieldConfig }) {
  const count = Array.isArray(value) ? value.length : 0;
  const Icon = config.icon;

  let caption = `${config.noun} upload — not yet connected`;
  if (disabled) caption = `${config.noun} upload`;
  else if (count > 0)
    caption = `${count} ${config.noun}${count === 1 ? '' : 's'} attached`;

  return (
    <FieldShell element={element} error={error}>
      <div className="border-muted-foreground/25 flex flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center">
        <Icon className="text-muted-foreground size-5" />
        <p className="text-muted-foreground text-xs capitalize">{caption}</p>
        <p className="text-muted-foreground/70 text-[11px]">{config.hint}</p>
      </div>
    </FieldShell>
  );
}

const PHOTO_CONFIG: UploadFieldConfig = {
  icon: Upload,
  noun: 'photo',
  hint: 'JPG, PNG, HEIC',
};

const VIDEO_CONFIG: UploadFieldConfig = {
  icon: Video,
  noun: 'video',
  hint: 'MP4, MOV, WEBM',
};

const FILE_CONFIG: UploadFieldConfig = {
  icon: Paperclip,
  noun: 'file',
  hint: 'PDF, DOCX, XLSX, DWG',
};

export function PhotoField(props: ElementFieldProps) {
  return <UploadField {...props} config={PHOTO_CONFIG} />;
}

export function VideoField(props: ElementFieldProps) {
  return <UploadField {...props} config={VIDEO_CONFIG} />;
}

export function FileField(props: ElementFieldProps) {
  return <UploadField {...props} config={FILE_CONFIG} />;
}

export function SignatureField({
  element,
  value,
  disabled,
  error,
}: ElementFieldProps) {
  let caption = 'Signature — not yet connected';
  if (value) caption = 'Signed';
  else if (disabled) caption = 'Signature';

  return (
    <FieldShell element={element} error={error}>
      <div className="border-muted-foreground/25 flex flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center">
        <PenLine className="text-muted-foreground size-5" />
        <p className="text-muted-foreground text-xs">{caption}</p>
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

export function DescriptionField({ element }: ElementFieldProps) {
  return <p className="text-muted-foreground text-sm">{element.label}</p>;
}

export function DividerField() {
  return <Separator />;
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
