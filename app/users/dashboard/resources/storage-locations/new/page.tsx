'use client';

import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { MapPin } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { CreateStorageLocationRequest } from '@tornotron/echno-core/storage-locations/types';
import { useCreateStorageLocation } from '@tornotron/echno-core/storage-locations/hooks';
import { toast } from '@/lib/styles/toast-styles';
import { StorageLocationForm } from '@/features/storage-locations/components/storage-location-form';

export default function NewLocationPage() {
  const router = useRouter();
  const createLocation = useCreateStorageLocation();

  const handleSubmit = (input: CreateStorageLocationRequest) => {
    createLocation.mutate(input, {
      onSuccess: () => {
        toast.success('Location Created', {
          description: 'The storage location has been created successfully',
        });
        router.push(routes.resources.storageLocations.href);
      },
      onError: (error) => {
        toast.error(getErrorTitle(error, 'Failed to Create Storage Location'), {
          description: getErrorMessage(error),
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        sticky
        title="Add New Location"
        description="Create a new storage or operational location"
        avatar={<MapPin className="h-6 w-6" />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Location Details</CardTitle>
          <CardDescription>
            Enter the information for the new location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StorageLocationForm
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isPending={createLocation.isPending}
            submitLabel="Create Location"
          />
        </CardContent>
      </Card>
    </div>
  );
}
