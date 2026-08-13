'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from '@/lib/styles/toast-styles';

/**
 * Error record for an entity form. Keys are the form's field names; values
 * are the human-readable error messages surfaced next to each field.
 */
export type FormErrors<T> = Partial<Record<keyof T, string>>;

/**
 * A form validator. Receives the current form and returns an error record.
 * An empty record means the form is valid. Build the record with the
 * helpers in `@/lib/validators` (`required`, `email`, ...).
 */
export type FormValidator<T> = (form: T) => FormErrors<T>;

/**
 * useEntityForm
 *
 * Encapsulates the string-only form-state boilerplate repeated across the
 * app's `*-form.tsx` components: the `form` values, the `errors` record, a
 * `set` helper that updates a field and clears its error, and a submit
 * handler that validates and toasts before handing the values to the caller.
 *
 * The form data is kept string-only by convention (all inputs are strings);
 * mapping to and from domain types stays in the caller.
 *
 * @param initial  the initial form values
 * @param validate returns an error record for the given form
 *
 * @example
 * ```tsx
 * const { form, errors, set, handleSubmit } = useEntityForm(EMPTY_FORM, (f) => {
 *   const e: FormErrors<FormData> = {};
 *   const name = required('Name')(f.name);
 *   if (name) e.name = name;
 *   return e;
 * });
 *
 * <form onSubmit={handleSubmit(props.onSubmit)}>...</form>
 * ```
 */
export function useEntityForm<T extends Record<string, string>>(
  initial: T,
  validate: FormValidator<T>
) {
  const [form, setForm] = useState<T>(initial);
  const [errors, setErrors] = useState<FormErrors<T>>({});

  function clearError(field: keyof T) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function set(field: keyof T, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  }

  function validateForm(): boolean {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  /**
   * Builds a submit handler. Prevents the default form submission, runs
   * `validate`, toasts on failure, and only then calls `onValid` with the
   * current form values.
   */
  function handleSubmit(onValid: (form: T) => void) {
    return (e: FormEvent) => {
      e.preventDefault();
      if (!validateForm()) {
        toast.error('Validation Error', {
          description: 'Please fix the errors in the form',
        });
        return;
      }
      onValid(form);
    };
  }

  return { form, errors, set, setForm, handleSubmit, clearError };
}
