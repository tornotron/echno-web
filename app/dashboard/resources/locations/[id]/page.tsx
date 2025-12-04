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
import { AppLayout } from '@/components/common';
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
  Package,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { locationTypeLabels, LocationType } from '@/types/resource/location';
import {
  mockLocations,
  mockLocationInventory,
  mockInventoryItems,
} from '@/components/shared/mock-data';

export default function ViewLocationPage() {
  const params = useParams();
  const locationId = Number.parseInt(params.id as string);

  // Find the location
  const location = mockLocations.find((l) => l.id === locationId);

  if (!location) {
    return (
      <AppLayout title="Location Not Found">
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">Location Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The location you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button asChild>
              <Link href="/dashboard/resources/locations">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Locations
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const getLocationIcon = (type: LocationType) => {
    switch (type) {
      case 'godown': {
        return <Warehouse className="h-6 w-6" />;
      }
      case 'head-office': {
        return <Building2 className="h-6 w-6" />;
      }
      case 'project-site': {
        return <Home className="h-6 w-6" />;
      }
      case 'warehouse': {
        return <Box className="h-6 w-6" />;
      }
      default: {
        return <MapPin className="h-6 w-6" />;
      }
    }
  };

  const inventoryCount = mockLocationInventory[location.id] || 0;
  const utilizationPercentage = location.capacity
    ? Math.round((inventoryCount / location.capacity) * 100)
    : 0;

  // Get inventory items at this location (mock data - in real app, filter by locationId)
  const locationInventory = mockInventoryItems.slice(0, 5); // Show first 5 items as sample

  return (
    <AppLayout title={location.name}>
      <div className="px-4 py-8">
        {/* Header with Actions */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className={`rounded-lg p-3 ${getTypeColor(location.type)}`}>
                {getLocationIcon(location.type)}
              </div>
              <div>
                <h1 className="mb-2 text-3xl font-bold">{location.name}</h1>
                <div>
                  <Badge variant="outline" className="mr-2">
                    {locationTypeLabels[location.type]}
                  </Badge>
                  <Badge variant={location.isActive ? 'default' : 'secondary'}>
                    {location.isActive ? (
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
              <Link href={`/dashboard/resources/locations/${location.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Location
              </Link>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Capacity</CardDescription>
              <CardTitle className="text-3xl">
                {location.capacity?.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-sm">Square Feet</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Items Stored</CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                {inventoryCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-sm">Total Items</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Utilization</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {utilizationPercentage}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-sm">Capacity Used</div>
            </CardContent>
          </Card>
        </div>

        {/* Details Section */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle>Location Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-muted-foreground mb-1 text-sm font-medium">
                  Location ID
                </div>
                <div className="text-base">{location.id}</div>
              </div>

              <div>
                <div className="text-muted-foreground mb-1 text-sm font-medium">
                  Address
                </div>
                <div className="flex items-start gap-2 text-base">
                  <MapPin className="mt-1 h-4 w-4 shrink-0" />
                  <span>{location.address || 'No address provided'}</span>
                </div>
              </div>

              <div>
                <div className="text-muted-foreground mb-1 text-sm font-medium">
                  Organization ID
                </div>
                <div className="text-base">{location.organizationId}</div>
              </div>

              {location.projectId && (
                <div>
                  <div className="text-muted-foreground mb-1 text-sm font-medium">
                    Project ID
                  </div>
                  <div className="text-base">{location.projectId}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm">Available Capacity</span>
                </div>
                <span className="font-semibold">
                  {((location.capacity || 0) - inventoryCount).toLocaleString()}{' '}
                  sq ft
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm">Utilization Rate</span>
                </div>
                <span className="font-semibold">{utilizationPercentage}%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm">Status</span>
                </div>
                <Badge variant={location.isActive ? 'default' : 'secondary'}>
                  {location.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Items at this Location */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Inventory Items</CardTitle>
                <CardDescription>Items stored at this location</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/resources/inventory">
                  View All Inventory
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {locationInventory.length > 0 ? (
              <div className="space-y-3">
                {locationInventory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="text-muted-foreground h-5 w-5" />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-muted-foreground text-sm">
                          ID: {item.itemId}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{item.quantity}</div>
                      <div className="text-muted-foreground text-sm">
                        {item.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                <Package className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>No inventory items at this location</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    godown: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    'head-office':
      'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
    'project-site':
      'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
    warehouse:
      'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
    other: 'bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
  };
  return colorMap[type] || colorMap.other;
};
