'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ProjectStatus,
  getProjectStatusLabel,
} from '@/types/project/project-status';
import { MapPin, Loader2 } from 'lucide-react';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useCallback } from 'react';

interface ProjectEditFormProps {
  formData: {
    projectName: string;
    projectAddress: string;
    status: ProjectStatus;
    projectLatitude: string;
    projectLongitude: string;
    startDate: string;
    endDate: string;
    description: string;
  };
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onStatusChange: (value: string) => void;
  onLocationUpdate?: (latitude: string, longitude: string) => void;
}

export function ProjectEditForm({
  formData,
  onInputChange,
  onStatusChange,
  onLocationUpdate,
}: ProjectEditFormProps) {
  const { isLoading, getCurrentLocation } = useGeolocation();

  const handleGetLocation = useCallback(() => {
    getCurrentLocation((lat, lng) => {
      onLocationUpdate?.(lat.toString(), lng.toString());
    });
  }, [getCurrentLocation, onLocationUpdate]);

  return (
    <div className="space-y-6">
      {/* Project Name */}
      <div className="space-y-2">
        <Label htmlFor="projectName">
          Project Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="projectName"
          name="projectName"
          value={formData.projectName}
          onChange={onInputChange}
          placeholder="e.g., Sunrise Tower"
          required
        />
      </div>

      {/* Project Address */}
      <div className="space-y-2">
        <Label htmlFor="projectAddress">
          Project Address <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="projectAddress"
          name="projectAddress"
          value={formData.projectAddress}
          onChange={onInputChange}
          placeholder="Enter the complete project address"
          rows={3}
          required
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select project status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ProjectStatus.upcoming}>
              {getProjectStatusLabel(ProjectStatus.upcoming)}
            </SelectItem>
            <SelectItem value={ProjectStatus.open}>
              {getProjectStatusLabel(ProjectStatus.open)}
            </SelectItem>
            <SelectItem value={ProjectStatus.onHold}>
              {getProjectStatusLabel(ProjectStatus.onHold)}
            </SelectItem>
            <SelectItem value={ProjectStatus.completed}>
              {getProjectStatusLabel(ProjectStatus.completed)}
            </SelectItem>
            <SelectItem value={ProjectStatus.closed}>
              {getProjectStatusLabel(ProjectStatus.closed)}
            </SelectItem>
            <SelectItem value={ProjectStatus.cancelled}>
              {getProjectStatusLabel(ProjectStatus.cancelled)}
            </SelectItem>
            <SelectItem value={ProjectStatus.dropped}>
              {getProjectStatusLabel(ProjectStatus.dropped)}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dates */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={onInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={onInputChange}
          />
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
            disabled={isLoading}
          >
            {isLoading ? (
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
            <Label htmlFor="projectLatitude">Latitude</Label>
            <Input
              id="projectLatitude"
              name="projectLatitude"
              type="number"
              step="any"
              value={formData.projectLatitude}
              onChange={onInputChange}
              placeholder="e.g., 19.0760"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectLongitude">Longitude</Label>
            <Input
              id="projectLongitude"
              name="projectLongitude"
              type="number"
              step="any"
              value={formData.projectLongitude}
              onChange={onInputChange}
              placeholder="e.g., 72.8777"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={onInputChange}
          placeholder="Enter project description (optional)"
          rows={4}
        />
      </div>
    </div>
  );
}
