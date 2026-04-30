'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/index';

// Re-export sub-components unchanged from components/ui base
export {
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

// Extended variants — add new ones here, never edit components/ui/card.tsx
const cardVariants = cva(
  'bg-card text-card-foreground flex flex-col rounded-xl border shadow-sm',
  {
    variants: {
      variant: {
        default: 'gap-6 py-6',
        feature:
          'group relative cursor-pointer gap-0 overflow-hidden rounded-none border-transparent p-8 shadow-none transition-all duration-[400ms] hover:-translate-y-1 hover:border-stone-300 hover:shadow-lg dark:hover:border-white/[0.08] dark:hover:shadow-none',
        form: 'gap-0 rounded-2xl border-stone-200 bg-white p-8 dark:border-white/6 dark:bg-zinc-900 dark:shadow-none',
        'feature-item':
          'flex-row items-center gap-3 rounded-xl border-stone-200 bg-white px-4 py-3.5 shadow-none dark:border-white/6 dark:bg-zinc-900',
        'contact-method':
          'group relative items-center gap-0 overflow-hidden rounded-2xl border-stone-200 bg-stone-50 p-6 text-center shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-stone-300 hover:shadow-md dark:border-white/6 dark:bg-zinc-950 dark:hover:border-white/10 dark:hover:shadow-none',
        problem:
          'group relative gap-0 overflow-hidden rounded-2xl border-stone-200 bg-white p-8 shadow-none transition-all duration-500 hover:-translate-y-1 hover:border-stone-300 hover:shadow-lg dark:border-white/6 dark:bg-zinc-900 dark:hover:border-white/10 dark:hover:shadow-none',
        testimonial:
          'group relative gap-0 overflow-hidden rounded-2xl border-stone-200 bg-stone-50 p-8 shadow-none transition-all duration-500 hover:-translate-y-1 hover:border-stone-300 hover:shadow-lg dark:border-white/6 dark:bg-zinc-900 dark:hover:border-white/10 dark:hover:shadow-none',
        metric:
          'gap-0 rounded-xl border-stone-200 bg-white/90 p-4 shadow-none backdrop-blur-md dark:border-white/8 dark:bg-zinc-900/90',
        status:
          'flex-row items-center gap-3 rounded-xl border-emerald-200 bg-emerald-50/80 px-4 py-3 shadow-none dark:border-emerald-500/20 dark:bg-emerald-500/5',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface CardProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof cardVariants> {}

function Card({ className, variant, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Card, cardVariants };
