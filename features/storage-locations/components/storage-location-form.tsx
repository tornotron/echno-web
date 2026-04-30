'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { MapPin, Save, X, Loader2 } from 'lucide-react';
import {
  StorageLocationType,
  STORAGE_LOCATION_TYPE_LABELS,
  CreateStorageLocationInput,
} from '@/types/storage-locations';
import { useProjects } from '@/hooks/project/use-projects';
import { useGeolocation } from '@/hooks/use-geolocation';
import { toast } from '@/lib/styles/toast-styles';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StorageLocationFormData {
  locationName: string;
  locationType: StorageLocationType;
  address: string;
  capacity: string;
  latitude: string;
  longitude: string;
  projectId: string;
  active: boolean;
}

interface StorageLocationFormProps {
  initialData?: Partial<StorageLocationFormData>;
  onSubmit: (input: CreateStorageLocationInput) => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel?: string;
}

// ---------------------------------------------------------------------------
// StorageLocationForm
// ---------------------------------------------------------------------------

export function StorageLocationForm({
  initialData,
  onSubmit,
  onCancel,
  isPending,
  submitLabel = 'Save',
}: StorageLocationFormProps) {
  const { data: projects = [] } = useProjects();
  const { isLoading: isGettingLocation, getCurrentLocation } = useGeolocation();

  const [formData, setFormData] = useState<StorageLocationFormData>({
    locationName: initialData?.locationName ?? '',
    locationType: initialData?.locationType ?? StorageLocationType.WAREHOUSE,
    address: initialData?.address ?? '',
    capacity: initialData?.capacity ?? '',
    latitude: initialData?.latitude ?? '',
    longitude: initialData?.longitude ?? '',
    projectId: initialData?.projectId ?? '',
    active: initialData?.active ?? true,
  });

  const isProjectSite =
    formData.locationType === StorageLocationType.PROJECT_SITE;

  const handleInputChange = (
    field: keyof StorageLocationFormData,
    value: string | boolean
  ) => {
    if (
      field === 'locationType' &&
      value !== StorageLocationType.PROJECT_SITE
    ) {
      setFormData({
        ...formData,
        locationType: value as StorageLocationType,
        projectId: '',
      });
      return;
    }
    setFormData({ ...formData, [field]: value });
  };

  const handleGetLocation = useCallback(() => {
    getCurrentLocation((lat, lng) => {
      setFormData((prev) => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));
    });
  }, [getCurrentLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.locationName.trim()) {
      toast.error('Please enter a location name');
      return;
    }

    const selectedProject = projects.find(
      (p) => p.id === Number(formData.projectId)
    );

    onSubmit({
      locationName: formData.locationName.trim(),
      locationType: formData.locationType,
      address: formData.address.trim() || undefined,
      capacity: formData.capacity ? Number(formData.capacity) : undefined,
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
      projectId: formData.projectId ? Number(formData.projectId) : undefined,
      projectName: selectedProject?.projectName,
      active: formData.active,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="locationName">
              Location Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="locationName"
              placeholder="e.g., Central Godown, Site Office"
              value={formData.locationName}
              onChange={(e) =>
                handleInputChange('locationName', e.target.value)
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationType">
              Location Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.locationType}
              onValueChange={(value) =>
                handleInputChange('locationType', value)
              }
            >
              <SelectTrigger id="locationType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STORAGE_LOCATION_TYPE_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {isProjectSite && (
            <div className="space-y-2">
              <Label htmlFor="projectId">Project</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) =>
                  handleInputChange('projectId', value === 'none' ? '' : value)
                }
              >
                <SelectTrigger id="projectId">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            placeholder="Enter full address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              placeholder="e.g., 5000"
              value={formData.capacity}
              onChange={(e) => handleInputChange('capacity', e.target.value)}
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.active ? 'active' : 'inactive'}
              onValueChange={(value) =>
                handleInputChange('active', value === 'active')
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

        {/* Location Coordinates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Location Coordinates</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Get Current Location
                </>
              )}
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                placeholder="e.g., 19.0760"
                value={formData.latitude}
                onChange={(e) => handleInputChange('latitude', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                placeholder="e.g., 72.8777"
                value={formData.longitude}
                onChange={(e) => handleInputChange('longitude', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isPending ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
