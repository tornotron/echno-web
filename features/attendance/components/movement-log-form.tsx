'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, MapPin, Route } from 'lucide-react';
import { toast } from '@/lib/styles/toast-styles';
import { useLogMovement } from '@/hooks/movement';
import {
  MovementType,
  getMovementTypeLabel,
} from '@/types/attendance/movement-type';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MovementLogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceId: number;
  employeeId: number;
  /** Whether GPS fields are required (from attendance settings) */
  geolocationRequired?: boolean;
}

interface MovementFormState {
  movementType: MovementType;
  fromLocation: string;
  toLocation: string;
  startTime: string;
  endTime: string;
  purpose: string;
  remarks: string;
  distanceKm: string;
  startLatitude: string;
  startLongitude: string;
  endLatitude: string;
  endLongitude: string;
}

const INITIAL_STATE: MovementFormState = {
  movementType: MovementType.siteTravel,
  fromLocation: '',
  toLocation: '',
  startTime: '',
  endTime: '',
  purpose: '',
  remarks: '',
  distanceKm: '',
  startLatitude: '',
  startLongitude: '',
  endLatitude: '',
  endLongitude: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function MovementLogForm({
  open,
  onOpenChange,
  attendanceId,
  employeeId,
  geolocationRequired = false,
}: MovementLogFormProps) {
  const logMutation = useLogMovement();
  const [form, setForm] = useState<MovementFormState>(INITIAL_STATE);
  const [useGPS, setUseGPS] = useState(geolocationRequired);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  function resetForm() {
    setForm(INITIAL_STATE);
    setUseGPS(geolocationRequired);
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  function fetchCurrentLocation(target: 'start' | 'end') {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        if (target === 'start') {
          setForm((f) => ({
            ...f,
            startLatitude: lat,
            startLongitude: lng,
          }));
        } else {
          setForm((f) => ({
            ...f,
            endLatitude: lat,
            endLongitude: lng,
          }));
        }
        setFetchingLocation(false);
        toast.success('Location captured');
      },
      (err) => {
        setFetchingLocation(false);
        toast.error(`Failed to get location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  function validate(): string | null {
    if (!form.fromLocation.trim()) return 'From location is required';
    if (!form.startTime) return 'Start time is required';
    if (!form.purpose.trim()) return 'Purpose is required';
    if (geolocationRequired && (!form.startLatitude || !form.startLongitude)) {
      return 'GPS coordinates are required for the start location';
    }
    return null;
  }

  function handleSubmit() {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    logMutation.mutate(
      {
        req: {
          attendanceId,
          movementType: form.movementType,
          fromLocation: form.fromLocation.trim(),
          toLocation: form.toLocation.trim() || undefined,
          startTime: new Date(form.startTime),
          endTime: form.endTime ? new Date(form.endTime) : undefined,
          purpose: form.purpose.trim(),
          remarks: form.remarks.trim() || undefined,
          distanceKm: form.distanceKm ? Number(form.distanceKm) : undefined,
          startLatitude: form.startLatitude
            ? Number(form.startLatitude)
            : undefined,
          startLongitude: form.startLongitude
            ? Number(form.startLongitude)
            : undefined,
          endLatitude: form.endLatitude ? Number(form.endLatitude) : undefined,
          endLongitude: form.endLongitude
            ? Number(form.endLongitude)
            : undefined,
        },
        employeeId,
      },
      {
        onSuccess: () => {
          toast.success('Movement recorded successfully');
          handleClose(false);
        },
        onError: () => toast.error('Failed to log movement'),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Route className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Log Movement</span>
          </DialogTitle>
          <DialogDescription>
            Record an off-site trip or activity for this attendance record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Movement Type */}
          <div className="space-y-2">
            <Label>Movement Type</Label>
            <Select
              value={form.movementType}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  movementType: v as MovementType,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MovementType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {getMovementTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                From Location <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Head Office"
                value={form.fromLocation}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fromLocation: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>To Location</Label>
              <Input
                placeholder="e.g. Project Site B"
                value={form.toLocation}
                onChange={(e) =>
                  setForm((f) => ({ ...f, toLocation: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startTime: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endTime: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <Label>
              Purpose <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Describe the purpose of this movement…"
              value={form.purpose}
              onChange={(e) =>
                setForm((f) => ({ ...f, purpose: e.target.value }))
              }
              rows={2}
            />
          </div>

          {/* Distance */}
          <div className="space-y-2">
            <Label>Distance (km)</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              placeholder="0.0"
              value={form.distanceKm}
              onChange={(e) =>
                setForm((f) => ({ ...f, distanceKm: e.target.value }))
              }
            />
          </div>

          {/* GPS Coordinates */}
          {(useGPS || geolocationRequired) && (
            <div className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  GPS Coordinates
                  {geolocationRequired && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </span>
              </div>

              {/* Start GPS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Start Location</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchCurrentLocation('start')}
                    disabled={fetchingLocation}
                    className="h-7 text-xs"
                  >
                    {fetchingLocation ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <MapPin className="mr-1 h-3 w-3" />
                    )}
                    Use Current
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={form.startLatitude}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        startLatitude: e.target.value,
                      }))
                    }
                  />
                  <Input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={form.startLongitude}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        startLongitude: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* End GPS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">End Location</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchCurrentLocation('end')}
                    disabled={fetchingLocation}
                    className="h-7 text-xs"
                  >
                    {fetchingLocation ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <MapPin className="mr-1 h-3 w-3" />
                    )}
                    Use Current
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={form.endLatitude}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        endLatitude: e.target.value,
                      }))
                    }
                  />
                  <Input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={form.endLongitude}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        endLongitude: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {!geolocationRequired && !useGPS && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-500"
              onClick={() => setUseGPS(true)}
            >
              <MapPin className="mr-1 h-3 w-3" />
              Add GPS coordinates
            </Button>
          )}

          {/* Remarks */}
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea
              placeholder="Any additional notes…"
              value={form.remarks}
              onChange={(e) =>
                setForm((f) => ({ ...f, remarks: e.target.value }))
              }
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={logMutation.isPending}>
            {logMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Route className="mr-2 h-4 w-4" />
            )}
            Log Movement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
