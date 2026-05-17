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
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Quantity</p>
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">{consumption.quantity}</div>
            <p className="text-muted-foreground text-xs">Units consumed</p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Date</p>
            <CalendarDays className="h-4 w-4 text-green-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(consumption.consumptionDate), 'dd MMM')}
            </div>
            <p className="text-muted-foreground text-xs">
              {format(new Date(consumption.consumptionDate), 'yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Recorded By</p>
            <User className="h-4 w-4 text-orange-600" />
          </div>
          <CardContent>
            <div className="truncate text-xl font-bold">
              {consumption.createdBy.name}
            </div>
            <p className="text-muted-foreground text-xs">Employee</p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Type</p>
            <FlameKindling className="h-4 w-4 text-zinc-400" />
          </div>
          <CardContent>
            <Badge
              className={`text-sm ${consumptionTypeBadgeColors[consumption.consumptionType]}`}
            >
              {consumptionTypeLabels[consumption.consumptionType]}
            </Badge>
            <p className="text-muted-foreground mt-1 text-xs">
              Consumption type
            </p>
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
