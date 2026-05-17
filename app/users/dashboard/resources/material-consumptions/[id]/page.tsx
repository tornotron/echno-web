'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from '@/components/shadcn/card';
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
import { useMaterialConsumption } from '@/hooks/materials';
import { ConsumptionType, consumptionTypeLabels } from '@/types/materials';
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Quantity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {consumption.quantity}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <CalendarDays className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {format(new Date(consumption.consumptionDate), 'dd MMM')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Recorded By</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <User className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="min-w-0 truncate text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {consumption.createdBy.name}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900/20">
                <FlameKindling className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
              </div>
              <Badge
                className={
                  consumptionTypeBadgeColors[consumption.consumptionType]
                }
              >
                {consumptionTypeLabels[consumption.consumptionType]}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

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
