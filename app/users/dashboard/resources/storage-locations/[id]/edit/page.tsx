'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowLeft, Trash2 } from 'lucide-react';
import { CreateStorageLocationInput } from '@/types/storage-locations';
import {
  useStorageLocation,
  useUpdateStorageLocation,
  useDeleteStorageLocation,
} from '@/hooks/storage-locations';
import { StorageLocationForm } from '@/features/storage-locations/components/storage-location-form';
import { DeleteStorageLocationDialog } from '@/features/storage-locations/components/storage-location-alert-dialogs';

export default function EditLocationPage() {
  const params = useParams();
  const router = useRouter();
  const locationId = Number(params.id);

  const { data: location, isLoading } = useStorageLocation(locationId);
  const updateLocation = useUpdateStorageLocation();
  const deleteLocation = useDeleteStorageLocation();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSubmit = (input: CreateStorageLocationInput) => {
    updateLocation.mutate(
      { id: locationId, input },
      {
        onSuccess: () => {
          router.push(
            `/users/dashboard/resources/storage-locations/${locationId}`
          );
        },
      }
    );
  };

  const handleDelete = () => {
    deleteLocation.mutate(locationId, {
      onSuccess: () => {
        router.push('/users/dashboard/resources/storage-locations');
      },
    });
  };

  const isPending = updateLocation.isPending || deleteLocation.isPending;

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
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            <div>
              <h1 className="text-3xl font-bold">Edit Location</h1>
              <p className="text-muted-foreground">
                Update the location information
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
            <CardDescription>
              Modify the information for this location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StorageLocationForm
              initialData={{
                locationName: location.locationName,
                locationType: location.locationType,
                address: location.address ?? '',
                capacity: location.capacity?.toString() ?? '',
                latitude: location.latitude?.toString() ?? '',
                longitude: location.longitude?.toString() ?? '',
                projectId: location.projectId?.toString() ?? '',
                active: location.active,
              }}
              onSubmit={handleSubmit}
              onCancel={() => router.back()}
              isPending={isPending}
              submitLabel="Save Changes"
            />
          </CardContent>
        </Card>
      </div>

      <DeleteStorageLocationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        locationName={location.locationName}
        isPending={deleteLocation.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
