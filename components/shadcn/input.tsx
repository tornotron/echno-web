'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/index';

// Extended variants — add new ones here, never edit components/ui/input.tsx
const inputVariants = cva(
  'w-full min-w-0 border bg-transparent text-base outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'h-9 rounded-md border-input bg-transparent px-3 py-1 text-base shadow-xs md:text-sm file:h-7 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40',
        marketing:
          'rounded-sm border-stone-200 bg-stone-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-white/8 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-amber-500 dark:focus:ring-amber-500/20',
        auth: 'h-9 rounded-md border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs focus-visible:border-amber-500 focus-visible:ring-amber-500/30 focus-visible:ring-[3px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface InputProps
  extends React.ComponentProps<'input'>,
    VariantProps<typeof inputVariants> {}

function Input({ className, type, variant, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Input, inputVariants };
