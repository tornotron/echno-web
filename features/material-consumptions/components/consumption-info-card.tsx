'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { ConsumptionType, consumptionTypeLabels } from '@/types/materials';
import type { MaterialConsumption } from '@/types/materials';

const consumptionTypeBadgeColors: Record<ConsumptionType, string> = {
  [ConsumptionType.usedFromStock]:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  [ConsumptionType.transferred]:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
};

interface ConsumptionInfoCardProps {
  consumption: MaterialConsumption;
}

export function ConsumptionInfoCard({ consumption }: ConsumptionInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ClipboardList className="h-4 w-4" />
          Consumption Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Material</span>
          <span className="font-medium">{consumption.materialName}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Quantity</span>
          <span className="font-medium">{consumption.quantity}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Type</span>
          <Badge
            className={consumptionTypeBadgeColors[consumption.consumptionType]}
          >
            {consumptionTypeLabels[consumption.consumptionType]}
          </Badge>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium">
            {format(new Date(consumption.consumptionDate), 'MMM dd, yyyy')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Recorded By</span>
          <span className="font-medium">{consumption.createdBy.name}</span>
        </div>
        {consumption.details && (
          <div className="border-t pt-2">
            <p className="text-muted-foreground mb-1">Details</p>
            <p className="text-sm">{consumption.details}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
