'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { MapPin, FolderOpen } from 'lucide-react';
import type { MaterialConsumption } from '@tornotron/echno-core/materials/types';

interface ConsumptionContextCardProps {
  consumption: MaterialConsumption;
}

export function ConsumptionContextCard({
  consumption,
}: ConsumptionContextCardProps) {
  const hasContext =
    consumption.projectName ||
    consumption.storageLocationName ||
    consumption.taskTitle;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" />
          Context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {consumption.projectName && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Project</span>
            <span className="flex items-center gap-1 font-medium">
              <FolderOpen className="h-3 w-3" />
              {consumption.projectName}
            </span>
          </div>
        )}
        {consumption.storageLocationName && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Storage Location</span>
            <span className="font-medium">
              {consumption.storageLocationName}
            </span>
          </div>
        )}
        {consumption.taskTitle && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Task</span>
            <span className="font-medium">{consumption.taskTitle}</span>
          </div>
        )}
        {!hasContext && (
          <p className="text-muted-foreground text-xs">
            No context linked to this consumption.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
