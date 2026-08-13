'use client';

import type { ReactNode } from 'react';
import { Label } from '@/components/shadcn/label';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
  /** Field label text. */
  label: string;
  /** `htmlFor` target, matched to the control's `id`. */
  htmlFor?: string;
  /** Renders the red required asterisk after the label. */
  required?: boolean;
  /** Error message shown below the control, in red. */
  error?: string;
  /**
   * Classes for the wrapping element. Grid placement (e.g. `md:col-span-2`)
   * belongs here so the field composes inside a caller-controlled grid.
   */
  className?: string;
  /** The form control (input, select, ...). */
  children: ReactNode;
}

/**
 * FormField
 *
 * The label + control + error triad shared by every form field. It owns the
 * `space-y-2` wrapper, the required asterisk, and the error paragraph, but
 * imposes no width or grid of its own: pass `className` to place it inside
 * the caller's grid.
 */
export function FormField({
  label,
  htmlFor,
  required,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
