'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { routes } from '@/nav';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/shadcn/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import {
  MapPin,
  Edit,
  Building2,
  Warehouse,
  Home,
  Box,
  CheckCircle2,
  XCircle,
  Calendar,
  FolderOpen,
  Package,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import {
  STORAGE_LOCATION_TYPE_LABELS,
  StorageLocationType,
} from '@tornotron/echno-core/storage-locations/types';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { useStorageLocation } from '@tornotron/echno-core/storage-locations/hooks';
import { StorageLocationStockTab } from '@/features/storage-locations/components';

export default function ViewLocationPage() {
  const params = useParams();
  const locationId = Number(params.id);

  const { data: location, isLoading } = useStorageLocation(locationId);

  const getLocationIcon = (type: StorageLocationType) => {
    switch (type) {
      case StorageLocationType.GODOWN: {
        return <Warehouse className="h-6 w-6" />;
      }
      case StorageLocationType.HEAD_OFFICE: {
        return <Building2 className="h-6 w-6" />;
      }
      case StorageLocationType.PROJECT_SITE: {
        return <Home className="h-6 w-6" />;
      }
      case StorageLocationType.WAREHOUSE: {
        return <Box className="h-6 w-6" />;
      }
      default: {
        return <MapPin className="h-6 w-6" />;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!location) {
    return (
      <Empty variant="default">
        <EmptyMedia variant="icon">
          <MapPin className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Location not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or the link is invalid.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline">
          <Link href={routes.resources.storageLocations.href}>
            Back to Locations
          </Link>
        </Button>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={location.locationName}
        avatar={
          <div
            className={`rounded-lg p-3 ${getTypeColor(location.locationType)}`}
          >
            {getLocationIcon(location.locationType)}
          </div>
        }
        description={
          <div className="flex gap-2">
            <Badge variant="outline">
              {STORAGE_LOCATION_TYPE_LABELS[location.locationType]}
            </Badge>
            <Badge variant={location.active ? 'default' : 'secondary'}>
              {location.active ? (
                <>
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                </>
              ) : (
                <>
                  <XCircle className="mr-1 h-3 w-3" /> Inactive
                </>
              )}
            </Badge>
          </div>
        }
        actions={
          <Button asChild>
            <Link
              href={routes.resources.storageLocations.detail(location.id).edit}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Location
            </Link>
          </Button>
        }
      />

      {/* Tabs: Details | Stock */}
      <Tabs defaultValue="details">
        <TabsList className="w-full">
          <TabsTrigger value="details" className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-1.5">
            <Package className="h-4 w-4" />
            Stock
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6 space-y-6">
          {/* Stats Cards */}
          <Card className="gap-0 p-6">
            <div className="sm:divide-border grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-0 sm:divide-x">
              <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Total Capacity
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {location.capacity == null
                      ? '—'
                      : location.capacity.toLocaleString()}
                  </p>
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <Package className="size-4 text-zinc-600 dark:text-zinc-400" />
                  </div>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  storage units
                </p>
              </div>
              <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Items Stored
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                    {location.storageItemsCount ?? 0}
                  </p>
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <Box className="size-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  total items
                </p>
              </div>
              <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Utilization
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                    {location.capacity
                      ? `${Math.round(((location.storageItemsCount ?? 0) / location.capacity) * 100)}%`
                      : '—'}
                  </p>
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                    <TrendingUp className="size-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  capacity used
                </p>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Location Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {location.address ? (
                  <div>
                    <div className="text-muted-foreground mb-1 text-sm font-medium">
                      Address
                    </div>
                    <div className="flex items-start gap-2 text-base">
                      <MapPin className="mt-1 h-4 w-4 shrink-0" />
                      <span>{location.address}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No address provided
                  </p>
                )}

                {(location.latitude != null || location.longitude != null) && (
                  <div>
                    <div className="text-muted-foreground mb-1 text-sm font-medium">
                      Coordinates
                    </div>
                    <div className="text-base">
                      {location.latitude ?? '—'}, {location.longitude ?? '—'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
                <CardDescription>Status and type details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">Type</span>
                  </div>
                  <span className="font-semibold">
                    {STORAGE_LOCATION_TYPE_LABELS[location.locationType]}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">Status</span>
                  </div>
                  <Badge variant={location.active ? 'default' : 'secondary'}>
                    {location.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {location.projectName && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm">Project</span>
                    </div>
                    <span className="font-semibold">
                      {location.projectName}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="mt-6 space-y-4">
          <StorageLocationStockTab storageLocationId={locationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const getTypeColor = (type: StorageLocationType) => {
  switch (type) {
    case StorageLocationType.GODOWN: {
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
    }
    case StorageLocationType.HEAD_OFFICE: {
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400';
    }
    case StorageLocationType.PROJECT_SITE: {
      return 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400';
    }
    case StorageLocationType.WAREHOUSE: {
      return 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400';
    }
    case StorageLocationType.PROCESSING_PLANT: {
      return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400';
    }
    default: {
      return 'bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400';
    }
  }
};
