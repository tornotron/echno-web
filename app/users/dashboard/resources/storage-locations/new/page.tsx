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
import { CreateStorageLocationRequest } from '@/types/storage-locations';
import { useCreateStorageLocation } from '@/hooks/storage-locations';
import { StorageLocationForm } from '@/features/storage-locations/components/storage-location-form';

export default function NewLocationPage() {
  const router = useRouter();
  const createLocation = useCreateStorageLocation();

  const handleSubmit = (input: CreateStorageLocationRequest) => {
    createLocation.mutate(input, {
      onSuccess: () => {
        router.push(routes.resources.storageLocations.href);
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
