import { useState } from 'react';
import Link from 'next/link';
import { routes } from '@/nav';
import { Badge } from '@/components/shadcn/badge';
import { AlertCircle, Cog, MapPin, Shield, Truck } from 'lucide-react';
import {
  assetStatusLabels,
  assetConditionLabels,
  getAssetStatusBadgeColor,
  getAssetConditionBadgeColor,
  calculateUtilization,
  isMaintenanceDue,
  type Asset,
} from '@/types/resource';

const getUtilizationColor = (utilization: number) => {
  if (utilization >= 80) return 'bg-red-500';
  if (utilization >= 60) return 'bg-orange-500';
  if (utilization >= 40) return 'bg-yellow-500';
  return 'bg-green-500';
};

interface AssetListItemProps {
  asset: Asset;
}

export function AssetListItem({ asset }: AssetListItemProps) {
  const [now] = useState(Date.now);
  const utilization = calculateUtilization(
    asset.usageHours,
    asset.maxUsageHours
  );
  const maintenanceDue = isMaintenanceDue(asset);
  const daysUntilMaintenance = asset.nextMaintenanceDate
    ? Math.floor(
        (asset.nextMaintenanceDate.getTime() - now) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <Link
      href={routes.resources.assets.detail(asset.id).href}
      className="block"
    >
      <div className="rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-blue-600">
                <Cog className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {asset.name}
                  </h3>
                  <span className="text-xs text-zinc-500">{asset.assetId}</span>
                  {maintenanceDue && (
                    <Badge
                      variant="outline"
                      className="border-orange-500 text-orange-600 dark:text-orange-400"
                    >
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Maintenance Due
                    </Badge>
                  )}
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {asset.description}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <div className="flex items-center text-xs text-zinc-500">
                    <Truck className="mr-1 h-3 w-3" />
                    {asset.manufacturer} {asset.model}
                  </div>
                  {asset.registrationNumber && (
                    <div className="flex items-center text-xs text-zinc-500">
                      <Shield className="mr-1 h-3 w-3" />
                      {asset.registrationNumber}
                    </div>
                  )}
                  <div className="flex items-center text-xs text-zinc-500">
                    <MapPin className="mr-1 h-3 w-3" />
                    {asset.location.name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Badge className={getAssetStatusBadgeColor(asset.status)}>
              {assetStatusLabels[asset.status]}
            </Badge>
            <Badge className={getAssetConditionBadgeColor(asset.condition)}>
              {assetConditionLabels[asset.condition]}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:w-auto lg:grid-cols-4">
            <div className="text-center">
              <div className="mb-1 text-xs text-zinc-500">Value</div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                ₹{(asset.currentValue / 100_000).toFixed(1)}L
              </div>
            </div>
            {asset.usageHours != null && asset.maxUsageHours != null && (
              <div className="text-center">
                <div className="mb-1 text-xs text-zinc-500">Utilization</div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {utilization.toFixed(0)}%
                </div>
              </div>
            )}
            {asset.nextMaintenanceDate && (
              <div className="text-center">
                <div className="mb-1 text-xs text-zinc-500">Next Service</div>
                <div
                  className={`text-sm font-semibold ${maintenanceDue ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-900 dark:text-zinc-100'}`}
                >
                  {daysUntilMaintenance !== null && daysUntilMaintenance >= 0
                    ? `${daysUntilMaintenance}d`
                    : 'Overdue'}
                </div>
              </div>
            )}
            {asset.assignedProject && (
              <div className="text-center">
                <div className="mb-1 text-xs text-zinc-500">Project</div>
                <div className="truncate text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {asset.assignedProject}
                </div>
              </div>
            )}
          </div>
        </div>

        {asset.usageHours != null && asset.maxUsageHours != null && (
          <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
              <span>
                Usage Hours: {asset.usageHours} / {asset.maxUsageHours}
              </span>
              <span>{utilization.toFixed(1)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className={`h-full transition-all ${getUtilizationColor(utilization)}`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
