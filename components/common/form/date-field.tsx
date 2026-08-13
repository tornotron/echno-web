'use client';

import { Input, type InputProps } from '@/components/shadcn/input';
import { FormField } from './form-field';

export interface DateFieldProps<K extends string>
  extends Omit<InputProps, 'value' | 'onChange' | 'name' | 'className' | 'type'> {
  /** Field label text. */
  label: string;
  /** Field key; used as the control `id` and passed back to `set`. */
  name: K;
  /** Current value, formatted `yyyy-MM-dd`. */
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
 * DateField
 *
 * A labelled `type="date"` input wired to `useEntityForm`.
 */
export function DateField<K extends string>({
  label,
  name,
  value,
  set,
  error,
  required,
  className,
  id,
  ...props
}: DateFieldProps<K>) {
  const fieldId = id ?? name;
  return (
    <FormField
      label={label}
      htmlFor={fieldId}
      required={required}
      error={error}
      className={className}
    >
      <Input
        id={fieldId}
        type="date"
        value={value}
        onChange={(e) => set(name, e.target.value)}
        className={error ? 'border-red-500' : ''}
        {...props}
      />
    </FormField>
  );
}
