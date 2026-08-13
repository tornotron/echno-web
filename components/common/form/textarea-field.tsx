'use client';

import { Textarea, type TextareaProps } from '@/components/shadcn/textarea';
import { FormField } from './form-field';

export interface TextareaFieldProps<K extends string>
  extends Omit<TextareaProps, 'value' | 'onChange' | 'name' | 'className'> {
  /** Field label text. */
  label: string;
  /** Field key; used as the control `id` and passed back to `set`. */
  name: K;
  /** Current string value. */
  value: string;
  /** Updater from `useEntityForm`; called with `(name, nextValue)`. */
  set: (field: K, value: string) => void;
  /** Error message; also toggles the red border. */
  error?: string;
  /** Renders the required asterisk. */
  required?: boolean;
  /** Wrapper classes for grid placement (e.g. `md:col-span-2`). */
  className?: string;
}

/**
 * TextareaField
 *
 * A labelled `Textarea` wired to `useEntityForm`. Remaining textarea
 * attributes (`rows`, `placeholder`, ...) pass through.
 */
export function TextareaField<K extends string>({
  label,
  name,
  value,
  set,
  error,
  required,
  className,
  id,
  ...props
}: TextareaFieldProps<K>) {
  const fieldId = id ?? name;
  return (
    <FormField
      label={label}
      htmlFor={fieldId}
      required={required}
      error={error}
      className={className}
    >
      <Textarea
        id={fieldId}
        value={value}
        onChange={(e) => set(name, e.target.value)}
        className={error ? 'border-red-500' : ''}
        {...props}
      />
    </FormField>
  );
}
