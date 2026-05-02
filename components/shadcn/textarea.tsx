'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/index';

// Extended variants — add new ones here, never edit components/ui/textarea.tsx
const textareaVariants = cva(
  'w-full border bg-transparent text-base outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground',
  {
    variants: {
      variant: {
        default:
          'flex field-sizing-content min-h-16 rounded-md border-input px-3 py-2 shadow-xs md:text-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40',
        marketing:
          'min-h-[120px] resize-none rounded-sm border-stone-200 bg-stone-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-white/8 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-amber-500 dark:focus:ring-amber-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface TextareaProps
  extends React.ComponentProps<'textarea'>,
    VariantProps<typeof textareaVariants> {}

function Textarea({ className, variant, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Textarea, textareaVariants };
