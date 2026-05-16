'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Card, CardContent } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
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
      <Card>
        <CardContent className="py-12 text-center">
          <FlameKindling className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
          <h3 className="mb-2 text-lg font-medium">
            Consumption record not found
          </h3>
          <Button
            onClick={() =>
              router.push(routes.resources.materialConsumptions.href)
            }
          >
            Back to Consumptions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {consumption.materialName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
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
        </div>
      </div>

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
