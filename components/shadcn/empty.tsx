'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/index';
import { EmptyMedia } from '@/components/ui/empty';

// Extended variants — add new ones here, never edit components/ui/empty.tsx
const emptyVariants = cva(
  'flex flex-col items-center justify-center text-center text-balance',
  {
    variants: {
      variant: {
        // Dashed border with subtle background — default empty state inside cards/tables
        default:
          'min-h-[240px] rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-12 dark:border-zinc-800 dark:bg-zinc-900/30',
        // Full-page empty — no border, generous padding, for whole-page zero states
        page: 'min-h-[400px] px-8 py-20',
        // Inline / compact — no border, minimal padding, for inside tables or small containers
        inline: 'min-h-[120px] px-4 py-6',
        // Inside a card section — subtle background, rounded, no dashed border
        card: 'min-h-[180px] rounded-lg bg-muted/40 px-6 py-10 dark:bg-muted/20',
        // Full-page error — same layout as page, used for not-found / fetch-error states
        error: 'min-h-[400px] px-8 py-20',
      },
      gap: {
        sm: 'gap-3',
        md: 'gap-5',
        lg: 'gap-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      gap: 'md',
    },
  }
);

export interface EmptyProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof emptyVariants> {}

function Empty({ className, variant, gap, ...props }: EmptyProps) {
  return (
    <div
      data-slot="empty"
      className={cn(emptyVariants({ variant, gap }), className)}
      {...props}
    />
  );
}

// Pre-styled icon wrapper for error states — renders a red-tinted icon badge
function EmptyErrorMedia({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <EmptyMedia
      variant="icon"
      className={cn(
        'bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400',
        className
      )}
    >
      {children}
    </EmptyMedia>
  );
}

export { Empty, EmptyErrorMedia, emptyVariants };

export {
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '@/components/ui/empty';
