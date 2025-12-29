'use client';

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppLayout } from '@/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapPin, Save, X, ArrowLeft, Trash2 } from 'lucide-react';
import { LocationType, locationTypeLabels } from '@/types/resource/location';
import { mockLocations } from '@/components/shared/mock-data';
import { toast } from 'sonner';

interface LocationFormData {
  name: string;
  type: LocationType;
  address: string;
  capacity: string;
  organizationId: string;
  projectId: string;
  isActive: boolean;
}

export default function EditLocationPage() {
  const params = useParams();
  const router = useRouter();
  const locationId = Number.parseInt(params.id as string);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [location, setLocation] = useState<(typeof mockLocations)[0] | null>(
    null
  );

  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    type: 'warehouse',
    address: '',
    capacity: '',
    organizationId: '',
    projectId: '',
    isActive: true,
  });

  useEffect(() => {
    // Find and load the location
    const foundLocation = mockLocations.find((l) => l.id === locationId);
    if (foundLocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocation(foundLocation);
      setFormData({
        name: foundLocation.name,
        type: foundLocation.type,
        address: foundLocation.address || '',
        capacity: foundLocation.capacity?.toString() || '',
        organizationId: foundLocation.organizationId.toString(),
        projectId: foundLocation.projectId?.toString() || '',
        isActive: foundLocation.isActive,
      });
    }
  }, [locationId]);

  const handleInputChange = (
    field: keyof LocationFormData,
    value: string | boolean
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter a location name');
      setIsSubmitting(false);
      return;
    }

    if (!formData.address.trim()) {
      toast.error('Please enter an address');
      setIsSubmitting(false);
      return;
    }

    if (!formData.capacity || Number.parseInt(formData.capacity) <= 0) {
      toast.error('Please enter a valid capacity');
      setIsSubmitting(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Location updated successfully!');
      router.push(`/dashboard/resources/locations/${locationId}`);
    } catch {
      toast.error('Failed to update location');
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this location? This action cannot be undone.'
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('Location deleted successfully!');
      router.push('/dashboard/resources/locations');
    } catch {
      toast.error('Failed to delete location');
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

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
              <Link href="/users/dashboard/resources/locations">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Locations
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Edit ${location.name}`}>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6" />
              <h1 className="text-3xl font-bold">Edit Location</h1>
            </div>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete Location'}
            </Button>
          </div>
          <p className="text-muted-foreground">
            Update the location information
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>
                Modify the information for this location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Location Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Main Warehouse, Site Office"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">
                    Location Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange('type', value)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(locationTypeLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  placeholder="Enter full address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  required
                />
              </div>

              {/* Capacity and Status */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="capacity">
                    Capacity (sq ft) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="e.g., 5000"
                    value={formData.capacity}
                    onChange={(e) =>
                      handleInputChange('capacity', e.target.value)
                    }
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onValueChange={(value) =>
                      handleInputChange('isActive', value === 'active')
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Optional: Organization and Project IDs */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organizationId">Organization ID</Label>
                  <Input
                    id="organizationId"
                    type="number"
                    placeholder="e.g., 1"
                    value={formData.organizationId}
                    onChange={(e) =>
                      handleInputChange('organizationId', e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId">Project ID (Optional)</Label>
                  <Input
                    id="projectId"
                    type="number"
                    placeholder="e.g., 101"
                    value={formData.projectId}
                    onChange={(e) =>
                      handleInputChange('projectId', e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting || isDeleting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isDeleting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
