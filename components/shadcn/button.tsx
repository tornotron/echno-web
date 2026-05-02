'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/index';

// Extended variants/sizes only — base string stays in components/ui/button.tsx
const buttonExtendedVariants = cva('', {
  variants: {
    variant: {
      gradient:
        'rounded-sm bg-gradient-to-br from-amber-400 to-orange-600 text-zinc-950 shadow-lg shadow-amber-500/20 duration-300 hover:scale-[1.02]',
      glass:
        'rounded-sm border border-zinc-300 bg-white/80 text-zinc-700 backdrop-blur-sm hover:border-zinc-400 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:border-white/20 dark:hover:bg-white/10',
      social:
        'rounded-sm border border-stone-200 bg-white text-xs font-bold text-zinc-500 duration-200 hover:border-stone-300 hover:text-zinc-900 dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-zinc-600 dark:hover:bg-white/[0.08] dark:hover:text-zinc-300',
    },
    size: {
      xl: 'h-auto px-8 py-4 text-base has-[>svg]:px-6',
    },
  },
});

type BaseVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
type ExtendedVariant = NonNullable<
  VariantProps<typeof buttonExtendedVariants>['variant']
>;
type BaseSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;
type ExtendedSize = NonNullable<
  VariantProps<typeof buttonExtendedVariants>['size']
>;

const EXTENDED_BUTTON_VARIANTS = new Set<string>([
  'gradient',
  'glass',
  'social',
]);
const EXTENDED_BUTTON_SIZES = new Set<string>(['xl']);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & {
  variant?: BaseVariant | ExtendedVariant;
  size?: BaseSize | ExtendedSize;
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        buttonVariants({
          variant: EXTENDED_BUTTON_VARIANTS.has(variant as string)
            ? 'default'
            : (variant as BaseVariant),
          size: EXTENDED_BUTTON_SIZES.has(size as string)
            ? 'default'
            : (size as BaseSize),
        }),
        buttonExtendedVariants({
          variant: EXTENDED_BUTTON_VARIANTS.has(variant as string)
            ? (variant as ExtendedVariant)
            : undefined,
          size: EXTENDED_BUTTON_SIZES.has(size as string)
            ? (size as ExtendedSize)
            : undefined,
        }),
        className
      )}
      {...props}
    />
  );
}

export { Button };

export { buttonVariants } from '@/components/ui/button';
