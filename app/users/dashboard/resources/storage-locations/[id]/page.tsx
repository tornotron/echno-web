'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Edit,
  ArrowLeft,
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
} from 'lucide-react';
import {
  StorageLocationType,
  STORAGE_LOCATION_TYPE_LABELS,
} from '@/types/storage-locations';
import { useStorageLocation } from '@/hooks/storage-locations';

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
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!location) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MapPin className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">Location Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The location you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/users/dashboard/resources/storage-locations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Locations
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`rounded-lg p-3 ${getTypeColor(location.locationType)}`}
          >
            {getLocationIcon(location.locationType)}
          </div>
          <div>
            <h1 className="mb-2 text-3xl font-bold">{location.locationName}</h1>
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
          </div>
        </div>
        <Button asChild>
          <Link
            href={`/users/dashboard/resources/storage-locations/${location.id}/edit`}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Location
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Capacity</CardDescription>
            <CardTitle className="text-3xl">
              {location.capacity == null
                ? '—'
                : location.capacity.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex items-center gap-1 text-sm">
              <Package className="h-4 w-4" />
              Units
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Items Stored</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {location.storageItemsCount ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex items-center gap-1 text-sm">
              <Box className="h-4 w-4" />
              Total Items
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Utilization</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {location.capacity
                ? `${Math.round(((location.storageItemsCount ?? 0) / location.capacity) * 100)}%`
                : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4" />
              Capacity Used
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
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

            {location.locationType === StorageLocationType.PROJECT_SITE &&
              location.projectName && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">Project</span>
                  </div>
                  <span className="font-semibold">{location.projectName}</span>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
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
