'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { FormField } from './form-field';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps<K extends string> {
  /** Field label text. */
  label: string;
  /** Field key; used as the control `id` and passed back to `set`. */
  name: K;
  /** Current string value. Empty string maps to `noneOption` when set. */
  value: string;
  /** Updater from `useEntityForm`; called with `(name, nextValue)`. */
  set: (field: K, value: string) => void;
  /** Selectable options. */
  options: SelectOption[];
  /** Placeholder shown when no value is selected. */
  placeholder?: string;
  /**
   * Optional sentinel option representing "no selection". When provided, an
   * empty `value` shows this option, and choosing it stores an empty string.
   * This mirrors the `'none' -> ''` pattern used by optional selects.
   */
  noneOption?: SelectOption;
  /** Error message; also toggles the red border. */
  error?: string;
  /** Renders the required asterisk. */
  required?: boolean;
  /** Wrapper classes for grid placement (e.g. `md:col-span-2`). */
  className?: string;
}

/**
 * SelectField
 *
 * A labelled shadcn `Select` wired to `useEntityForm`. Pass `options` as
 * `{ value, label }[]`. For optional selects, pass `noneOption` to get the
 * "empty value shows a sentinel item" behaviour without leaking the sentinel
 * into the stored form value.
 */
export function SelectField<K extends string>({
  label,
  name,
  value,
  set,
  options,
  placeholder,
  noneOption,
  error,
  required,
  className,
}: SelectFieldProps<K>) {
  const selectValue = noneOption ? value || noneOption.value : value;

  function handleChange(next: string) {
    if (noneOption && next === noneOption.value) {
      set(name, '');
      return;
    }
    set(name, next);
  }

  return (
    <FormField
      label={label}
      htmlFor={name}
      required={required}
      error={error}
      className={className}
    >
      <Select value={selectValue} onValueChange={handleChange}>
        <SelectTrigger id={name} className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {noneOption && (
            <SelectItem value={noneOption.value}>{noneOption.label}</SelectItem>
          )}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}
