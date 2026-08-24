'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { MapPin, ArrowLeft, Trash2, Loader2, Save } from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { CreateStorageLocationRequest } from '@tornotron/echno-core/storage-locations/types';
import {
  useDeleteStorageLocation,
  useStorageLocation,
  useUpdateStorageLocation,
} from '@tornotron/echno-core/storage-locations/hooks';
import { toast } from '@/lib/styles/toast-styles';
import {
  StorageLocationForm,
  STORAGE_LOCATION_FORM_ID,
} from '@/features/storage-locations/components/storage-location-form';
import { DeleteStorageLocationDialog } from '@/features/storage-locations/components/storage-location-alert-dialogs';

export default function EditLocationPage() {
  const params = useParams();
  const router = useRouter();
  const locationId = Number(params.id);

  const { data: location, isLoading } = useStorageLocation(locationId);
  const updateLocation = useUpdateStorageLocation();
  const deleteLocation = useDeleteStorageLocation();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSubmit = (input: CreateStorageLocationRequest) => {
    updateLocation.mutate(
      { id: locationId, data: input },
      {
        onSuccess: () => {
          toast.success('Location Updated', {
            description: 'The storage location has been updated successfully',
          });
          router.push(
            routes.resources.storageLocations.detail(locationId).href
          );
        },
        onError: (error) => {
          toast.error(
            getErrorTitle(error, 'Failed to Update Storage Location'),
            { description: getErrorMessage(error) }
          );
        },
      }
    );
  };

  const handleDelete = () => {
    deleteLocation.mutate(locationId, {
      onSuccess: () => {
        toast.success('Location Deleted', {
          description: 'The storage location has been deleted successfully',
        });
        router.push(routes.resources.storageLocations.href);
      },
      onError: (error) => {
        toast.error(getErrorTitle(error, 'Failed to Delete Storage Location'), {
          description: getErrorMessage(error),
        });
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
    <>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          sticky
          title="Edit Location"
          description="Update the location information"
          avatar={<MapPin className="h-6 w-6" />}
          actions={
            <>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form={STORAGE_LOCATION_FORM_ID}
                disabled={isPending}
              >
                {updateLocation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          }
        />

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
