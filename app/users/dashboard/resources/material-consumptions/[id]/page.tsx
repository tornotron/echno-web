'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Card, CardContent } from '@/components/shadcn/card';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/shadcn/badge';
import {
  Loader2,
  FlameKindling,
  Package,
  CalendarDays,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  ConsumptionType,
  consumptionTypeLabels,
} from '@tornotron/echno-core/materials/types';
import { useMaterialConsumption } from '@tornotron/echno-core/material-consumption/hooks';
import {
  ConsumptionInfoCard,
  ConsumptionContextCard,
} from '@/features/material-consumptions/components';

const consumptionTypeBadgeColors: Record<ConsumptionType, string> = {
  [ConsumptionType.usedFromStock]:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  [ConsumptionType.transferred]:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
};

export default function MaterialConsumptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = use(params);
  const id = Number(rawId);
  const router = useRouter();

  const { data: consumption, isLoading } = useMaterialConsumption(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-zinc-400" />
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading consumption...
          </p>
        </div>
      </div>
    );
  }

  if (!consumption) {
    return (
      <Empty variant="default">
        <EmptyMedia variant="icon">
          <FlameKindling className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Consumption record not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or the link is invalid.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline">
          <Link href={routes.resources.materialConsumptions.href}>
            Back to Consumptions
          </Link>
        </Button>
      </Empty>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeader
        title={consumption.materialName}
        description={
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={
                consumptionTypeBadgeColors[consumption.consumptionType]
              }
            >
              {consumptionTypeLabels[consumption.consumptionType]}
            </Badge>
            <span className="text-muted-foreground text-sm">
              Recorded{' '}
              {format(new Date(consumption.consumptionDate), 'MMM dd, yyyy')}
            </span>
          </div>
        }
      />

      {/* Key Metrics */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Quantity</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {consumption.quantity}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Package className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              units consumed
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Date</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {format(new Date(consumption.consumptionDate), 'dd MMM')}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CalendarDays className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              recorded on
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Recorded By
            </p>
            <div className="flex min-w-0 items-center justify-between gap-2">
              <p className="min-w-0 truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {consumption.createdBy.name}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <User className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              entered by
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Type</p>
            <div className="flex items-center justify-between">
              <Badge
                className={
                  consumptionTypeBadgeColors[consumption.consumptionType]
                }
              >
                {consumptionTypeLabels[consumption.consumptionType]}
              </Badge>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <FlameKindling className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              consumption type
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <ConsumptionInfoCard consumption={consumption} />
        <ConsumptionContextCard consumption={consumption} />
      </div>

      <div>
        <Button variant="outline" asChild>
          <Link href={routes.resources.materialConsumptions.href}>
            ← Back to Consumptions
          </Link>
        </Button>
      </div>
    </div>
  );
}
