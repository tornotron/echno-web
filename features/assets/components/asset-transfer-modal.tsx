'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
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
import { X, MapPin } from 'lucide-react';
import { Asset } from '@/types/resource';
import { useStorageLocations } from '@/hooks/storage-locations';
import { toast } from '@/lib/styles/toast-styles';

interface AssetTransferModalProps {
  asset: Asset;
  onClose: () => void;
  onTransfer: () => void;
}

export function AssetTransferModal({
  asset,
  onClose,
  onTransfer,
}: AssetTransferModalProps) {
  const { data: locations = [] } = useStorageLocations();
  const [formData, setFormData] = useState({
    toLocationId: '',
    transferDate: format(new Date(), 'yyyy-MM-dd'),
    transferredBy: '',
    reason: '',
    notes: '',
    newAssignedTo: asset.assignedTo || '',
    newProject: asset.assignedProject || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.toLocationId || !formData.transferredBy || !formData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    // In real app, make API call
    toast.success('Asset transfer initiated successfully!');
    onTransfer();
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Transfer Asset</CardTitle>
              <CardDescription>
                Transfer {asset.name} to a new location
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Location */}
            <div className="rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-900">
              <div className="mb-1 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <MapPin className="h-4 w-4" />
                Current Location
              </div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {asset.location.name}
              </p>
              {asset.location.address && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {asset.location.address}
                </p>
              )}
            </div>

            {/* Transfer Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="toLocationId">
                  New Location <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.toLocationId}
                  onValueChange={(value) =>
                    handleInputChange('toLocationId', value)
                  }
                  required
                >
                  <SelectTrigger id="toLocationId">
                    <SelectValue placeholder="Select new location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations
                      .filter((loc) => loc.id !== asset.locationId)
                      .map((location) => (
                        <SelectItem
                          key={location.id}
                          value={location.id.toString()}
                        >
                          {location.locationName}
                          {location.address && ` - ${location.address}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transferDate">
                  Transfer Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="transferDate"
                  type="date"
                  value={formData.transferDate}
                  onChange={(e) =>
                    handleInputChange('transferDate', e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transferredBy">
                  Transferred By <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="transferredBy"
                  placeholder="e.g., Amit Sharma"
                  value={formData.transferredBy}
                  onChange={(e) =>
                    handleInputChange('transferredBy', e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reason">
                  Transfer Reason <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.reason}
                  onValueChange={(value) => handleInputChange('reason', value)}
                  required
                >
                  <SelectTrigger id="reason">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="project_reassignment">
                      Project Reassignment
                    </SelectItem>
                    <SelectItem value="maintenance_completion">
                      Maintenance Completion
                    </SelectItem>
                    <SelectItem value="new_project_deployment">
                      New Project Deployment
                    </SelectItem>
                    <SelectItem value="equipment_pooling">
                      Equipment Pooling
                    </SelectItem>
                    <SelectItem value="equipment_failure">
                      Equipment Failure
                    </SelectItem>
                    <SelectItem value="relocation">Relocation</SelectItem>
                    <SelectItem value="return_to_warehouse">
                      Return to Warehouse
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newAssignedTo">
                  New Assigned To (Optional)
                </Label>
                <Input
                  id="newAssignedTo"
                  placeholder="e.g., John Doe"
                  value={formData.newAssignedTo}
                  onChange={(e) =>
                    handleInputChange('newAssignedTo', e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newProject">New Project (Optional)</Label>
                <Input
                  id="newProject"
                  placeholder="e.g., Highway Expansion"
                  value={formData.newProject}
                  onChange={(e) =>
                    handleInputChange('newProject', e.target.value)
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Transfer Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes about this transfer..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Confirm Transfer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
