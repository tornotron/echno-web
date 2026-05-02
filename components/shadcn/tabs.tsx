'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Tabs as TabsPrimitive } from 'radix-ui';

import { tabsListVariants } from '@/components/ui/tabs';
import { cn } from '@/lib/utils/index';

// Re-export base primitives unchanged
export { Tabs, TabsContent } from '@/components/ui/tabs';

// ── Extended TabsList ─────────────────────────────────────────────────────────
// Adds the 'segment' variant on top of the base 'default' and 'line' variants.

const tabsListExtendedVariants = cva('', {
  variants: {
    variant: {
      segment:
        'h-auto w-full gap-1 rounded-lg border bg-card p-1 shadow-sm overflow-x-auto overflow-y-hidden',
    },
  },
});

type BaseListVariant = NonNullable<
  VariantProps<typeof tabsListVariants>['variant']
>;
type ExtendedListVariant = NonNullable<
  VariantProps<typeof tabsListExtendedVariants>['variant']
>;

const EXTENDED_LIST_VARIANTS = new Set<string>(['segment']);

function TabsList({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  variant?: BaseListVariant | ExtendedListVariant;
}) {
  const isExtended = EXTENDED_LIST_VARIANTS.has(variant as string);
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        isExtended
          ? cn(
              // Override base pill shape for segment: flex, full-width, no fixed height
              'group/tabs-list text-muted-foreground inline-flex items-center',
              tabsListExtendedVariants({
                variant: variant as ExtendedListVariant,
              })
            )
          : tabsListVariants({ variant: variant as BaseListVariant }),
        className
      )}
      {...props}
    />
  );
}

// ── Extended TabsTrigger ──────────────────────────────────────────────────────
// Adds a 'segment' style: icon stacked above label, solid primary fill when active.

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styles shared across all variants
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring relative flex-1 cursor-pointer font-medium whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50',
        // Default base trigger styles (used when NOT in segment list)
        'group-data-[variant=default]/tabs-list:text-foreground/60 group-data-[variant=default]/tabs-list:hover:text-foreground group-data-[variant=default]/tabs-list:data-[state=active]:bg-background group-data-[variant=default]/tabs-list:data-[state=active]:text-foreground dark:group-data-[variant=default]/tabs-list:text-muted-foreground dark:group-data-[variant=default]/tabs-list:hover:text-foreground dark:group-data-[variant=default]/tabs-list:data-[state=active]:border-input dark:group-data-[variant=default]/tabs-list:data-[state=active]:bg-input/30 group-data-[variant=default]/tabs-list:inline-flex group-data-[variant=default]/tabs-list:h-[calc(100%-1px)] group-data-[variant=default]/tabs-list:items-center group-data-[variant=default]/tabs-list:justify-center group-data-[variant=default]/tabs-list:gap-1.5 group-data-[variant=default]/tabs-list:rounded-md group-data-[variant=default]/tabs-list:border group-data-[variant=default]/tabs-list:border-transparent group-data-[variant=default]/tabs-list:px-2 group-data-[variant=default]/tabs-list:py-1 group-data-[variant=default]/tabs-list:text-sm group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm',
        // Line variant trigger styles
        'group-data-[variant=line]/tabs-list:text-foreground/60 group-data-[variant=line]/tabs-list:hover:text-foreground group-data-[variant=line]/tabs-list:data-[state=active]:text-foreground after:bg-foreground group-data-[variant=line]/tabs-list:inline-flex group-data-[variant=line]/tabs-list:h-[calc(100%-1px)] group-data-[variant=line]/tabs-list:items-center group-data-[variant=line]/tabs-list:justify-center group-data-[variant=line]/tabs-list:gap-1.5 group-data-[variant=line]/tabs-list:rounded-md group-data-[variant=line]/tabs-list:border group-data-[variant=line]/tabs-list:border-transparent group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:px-2 group-data-[variant=line]/tabs-list:py-1 group-data-[variant=line]/tabs-list:text-sm after:absolute after:inset-x-0 after:bottom-[-5px] after:h-0.5 after:opacity-0 after:transition-opacity group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100',
        // Segment variant trigger styles
        'group-data-[variant=segment]/tabs-list:hover:bg-muted group-data-[variant=segment]/tabs-list:data-[state=active]:bg-primary group-data-[variant=segment]/tabs-list:data-[state=active]:text-primary-foreground group-data-[variant=segment]/tabs-list:flex group-data-[variant=segment]/tabs-list:flex-row group-data-[variant=segment]/tabs-list:items-center group-data-[variant=segment]/tabs-list:gap-2 group-data-[variant=segment]/tabs-list:rounded-md group-data-[variant=segment]/tabs-list:px-3 group-data-[variant=segment]/tabs-list:py-1.5 group-data-[variant=segment]/tabs-list:text-xs group-data-[variant=segment]/tabs-list:text-zinc-500 group-data-[variant=segment]/tabs-list:hover:text-zinc-900 group-data-[variant=segment]/tabs-list:data-[state=active]:shadow-sm dark:group-data-[variant=segment]/tabs-list:text-zinc-400 dark:group-data-[variant=segment]/tabs-list:hover:text-zinc-100',
        className
      )}
      {...props}
    />
  );
}

export { TabsList, TabsTrigger };
export { tabsListVariants } from '@/components/ui/tabs';
