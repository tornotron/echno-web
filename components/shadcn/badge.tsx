'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';

import { badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils/index';

// Extended variants only — base string stays in components/ui/badge.tsx
const badgeExtendedVariants = cva('', {
  variants: {
    variant: {
      brand:
        'h-7 w-7 shrink-0 rounded border border-amber-200 bg-amber-50 p-0 text-[10px] font-black text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-500',
      amber:
        'border border-amber-300/60 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/8 dark:text-amber-500',
    },
  },
});

type BaseVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;
type ExtendedVariant = NonNullable<
  VariantProps<typeof badgeExtendedVariants>['variant']
>;

export interface BadgeProps extends React.ComponentProps<'span'> {
  variant?: BaseVariant | ExtendedVariant;
  asChild?: boolean;
}

const EXTENDED_BADGE_VARIANTS = new Set<string>(['brand', 'amber']);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : 'span';
  const classes = EXTENDED_BADGE_VARIANTS.has(variant)
    ? cn(
        badgeVariants(),
        'rounded-lg',
        badgeExtendedVariants({ variant: variant as ExtendedVariant }),
        className
      )
    : cn(
        badgeVariants({ variant: variant as BaseVariant }),
        'rounded-lg',
        className
      );

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={classes}
      {...props}
    />
  );
}

export { Badge };

export { badgeVariants } from '@/components/ui/badge';
