'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { format } from 'date-fns';
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
import { AppLayout } from '@/components/common/app-layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, X } from 'lucide-react';
import { AssetType, AssetStatus, AssetCondition } from '@/types/resource';
import { toast } from 'sonner';
import { mockAssets, mockLocations } from '@/components/shared/mock-data';

export default function EditAssetPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = Number.parseInt(params.id as string);
  const asset = mockAssets.find((a) => a.id === assetId);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '' as AssetType | '',
    category: '',
    status: 'available' as AssetStatus,
    condition: 'good' as AssetCondition,
    locationId: '',
    assignedTo: '',
    assignedProject: '',
    purchaseDate: '',
    purchasePrice: '',
    depreciationRate: '10',
    manufacturer: '',
    model: '',
    serialNumber: '',
    registrationNumber: '',
    warrantyExpiry: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    maintenanceSchedule: '',
    usageHours: '',
    maxUsageHours: '',
    fuelType: '',
    insuranceProvider: '',
    policyNumber: '',
    insuranceExpiry: '',
    notes: '',
  });

  useEffect(() => {
    if (asset) {
      setTimeout(() => {
        setFormData({
          name: asset.name,
          description: asset.description,
          type: asset.type,
          category: asset.category,
          status: asset.status,
          condition: asset.condition,
          locationId: asset.locationId.toString(),
          assignedTo: asset.assignedTo || '',
          assignedProject: asset.assignedProject || '',
          purchaseDate: format(asset.purchaseDate, 'yyyy-MM-dd'),
          purchasePrice: asset.purchasePrice.toString(),
          depreciationRate: asset.depreciationRate.toString(),
          manufacturer: asset.manufacturer || '',
          model: asset.model || '',
          serialNumber: asset.serialNumber || '',
          registrationNumber: asset.registrationNumber || '',
          warrantyExpiry: asset.warrantyExpiry
            ? format(asset.warrantyExpiry, 'yyyy-MM-dd')
            : '',
          lastMaintenanceDate: asset.lastMaintenanceDate
            ? format(asset.lastMaintenanceDate, 'yyyy-MM-dd')
            : '',
          nextMaintenanceDate: asset.nextMaintenanceDate
            ? format(asset.nextMaintenanceDate, 'yyyy-MM-dd')
            : '',
          maintenanceSchedule: asset.maintenanceSchedule || '',
          usageHours: asset.usageHours?.toString() || '',
          maxUsageHours: asset.maxUsageHours?.toString() || '',
          fuelType: asset.fuelType || '',
          insuranceProvider: asset.insuranceProvider || '',
          policyNumber: asset.policyNumber || '',
          insuranceExpiry: asset.insuranceExpiry
            ? format(asset.insuranceExpiry, 'yyyy-MM-dd')
            : '',
          notes: asset.notes || '',
        });
      }, 0);
    }
  }, [asset]);

  if (!asset) {
    return (
      <AppLayout>
        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
                Asset Not Found
              </h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                The asset you&apos;re trying to edit doesn&apos;t exist.
              </p>
              <Link href="/dashboard/resources/assets">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Assets
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    if (
      !formData.name ||
      !formData.type ||
      !formData.locationId ||
      !formData.purchaseDate ||
      !formData.purchasePrice
    ) {
      toast.error('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    // In real app, make API call
    setTimeout(() => {
      toast.success('Asset updated successfully!');
      router.push(`/dashboard/resources/assets/${assetId}`);
    }, 1000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Edit Asset</h1>
            <p className="text-muted-foreground">Update asset information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Form - Left Side (2 columns) */}
            <div className="space-y-6 md:col-span-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Update the basic details of the asset
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="name">
                        Asset Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g., Excavator CAT 320D"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange('name', e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter asset description..."
                        value={formData.description}
                        onChange={(e) =>
                          handleInputChange('description', e.target.value)
                        }
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">
                        Asset Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          handleInputChange('type', value)
                        }
                        required
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="heavy-equipment">
                            Heavy Equipment
                          </SelectItem>
                          <SelectItem value="light-equipment">
                            Light Equipment
                          </SelectItem>
                          <SelectItem value="vehicle">Vehicle</SelectItem>
                          <SelectItem value="tool">Tool</SelectItem>
                          <SelectItem value="machinery">Machinery</SelectItem>
                          <SelectItem value="generator">Generator</SelectItem>
                          <SelectItem value="computer">
                            Computer & IT
                          </SelectItem>
                          <SelectItem value="furniture">Furniture</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        placeholder="e.g., Excavators"
                        value={formData.category}
                        onChange={(e) =>
                          handleInputChange('category', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      <Input
                        id="manufacturer"
                        placeholder="e.g., Caterpillar"
                        value={formData.manufacturer}
                        onChange={(e) =>
                          handleInputChange('manufacturer', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        placeholder="e.g., 320D"
                        value={formData.model}
                        onChange={(e) =>
                          handleInputChange('model', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serialNumber">Serial Number</Label>
                      <Input
                        id="serialNumber"
                        placeholder="e.g., CAT320D2024001"
                        value={formData.serialNumber}
                        onChange={(e) =>
                          handleInputChange('serialNumber', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registrationNumber">
                        Registration Number
                      </Label>
                      <Input
                        id="registrationNumber"
                        placeholder="e.g., KA-01-EQ-1234"
                        value={formData.registrationNumber}
                        onChange={(e) =>
                          handleInputChange(
                            'registrationNumber',
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase & Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Purchase & Financial Details</CardTitle>
                  <CardDescription>
                    Asset purchase and valuation information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="purchaseDate">
                        Purchase Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="purchaseDate"
                        type="date"
                        value={formData.purchaseDate}
                        onChange={(e) =>
                          handleInputChange('purchaseDate', e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice">
                        Purchase Price (₹){' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="purchasePrice"
                        type="number"
                        placeholder="e.g., 8500000"
                        value={formData.purchasePrice}
                        onChange={(e) =>
                          handleInputChange('purchasePrice', e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="depreciationRate">
                        Depreciation Rate (%)
                      </Label>
                      <Input
                        id="depreciationRate"
                        type="number"
                        step="0.1"
                        placeholder="e.g., 10"
                        value={formData.depreciationRate}
                        onChange={(e) =>
                          handleInputChange('depreciationRate', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                      <Input
                        id="warrantyExpiry"
                        type="date"
                        value={formData.warrantyExpiry}
                        onChange={(e) =>
                          handleInputChange('warrantyExpiry', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Operational Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Operational Details</CardTitle>
                  <CardDescription>
                    Usage and maintenance information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="usageHours">Current Usage Hours</Label>
                      <Input
                        id="usageHours"
                        type="number"
                        placeholder="e.g., 4200"
                        value={formData.usageHours}
                        onChange={(e) =>
                          handleInputChange('usageHours', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxUsageHours">Max Usage Hours</Label>
                      <Input
                        id="maxUsageHours"
                        type="number"
                        placeholder="e.g., 15000"
                        value={formData.maxUsageHours}
                        onChange={(e) =>
                          handleInputChange('maxUsageHours', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fuelType">Fuel Type</Label>
                      <Select
                        value={formData.fuelType}
                        onValueChange={(value) =>
                          handleInputChange('fuelType', value)
                        }
                      >
                        <SelectTrigger id="fuelType">
                          <SelectValue placeholder="Select fuel type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Diesel">Diesel</SelectItem>
                          <SelectItem value="Petrol">Petrol</SelectItem>
                          <SelectItem value="Electric">Electric</SelectItem>
                          <SelectItem value="CNG">CNG</SelectItem>
                          <SelectItem value="Hybrid">Hybrid</SelectItem>
                          <SelectItem value="N/A">Not Applicable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maintenanceSchedule">
                        Maintenance Schedule
                      </Label>
                      <Input
                        id="maintenanceSchedule"
                        placeholder="e.g., Every 500 hours"
                        value={formData.maintenanceSchedule}
                        onChange={(e) =>
                          handleInputChange(
                            'maintenanceSchedule',
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastMaintenanceDate">
                        Last Maintenance Date
                      </Label>
                      <Input
                        id="lastMaintenanceDate"
                        type="date"
                        value={formData.lastMaintenanceDate}
                        onChange={(e) =>
                          handleInputChange(
                            'lastMaintenanceDate',
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nextMaintenanceDate">
                        Next Maintenance Date
                      </Label>
                      <Input
                        id="nextMaintenanceDate"
                        type="date"
                        value={formData.nextMaintenanceDate}
                        onChange={(e) =>
                          handleInputChange(
                            'nextMaintenanceDate',
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insurance Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Insurance Information</CardTitle>
                  <CardDescription>Asset insurance details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="insuranceProvider">
                        Insurance Provider
                      </Label>
                      <Input
                        id="insuranceProvider"
                        placeholder="e.g., HDFC Ergo"
                        value={formData.insuranceProvider}
                        onChange={(e) =>
                          handleInputChange('insuranceProvider', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="policyNumber">Policy Number</Label>
                      <Input
                        id="policyNumber"
                        placeholder="e.g., HDFC-EQ-2024-001"
                        value={formData.policyNumber}
                        onChange={(e) =>
                          handleInputChange('policyNumber', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
                      <Input
                        id="insuranceExpiry"
                        type="date"
                        value={formData.insuranceExpiry}
                        onChange={(e) =>
                          handleInputChange('insuranceExpiry', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional notes or comments..."
                      value={formData.notes}
                      onChange={(e) =>
                        handleInputChange('notes', e.target.value)
                      }
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Status & Location */}
              <Card>
                <CardHeader>
                  <CardTitle>Status & Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleInputChange('status', value)
                      }
                      required
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="in-use">In Use</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="repair">Under Repair</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="disposed">Disposed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condition">
                      Condition <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) =>
                        handleInputChange('condition', value)
                      }
                      required
                    >
                      <SelectTrigger id="condition">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="locationId">
                      Location <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.locationId}
                      onValueChange={(value) =>
                        handleInputChange('locationId', value)
                      }
                      required
                    >
                      <SelectTrigger id="locationId">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockLocations.map((location) => (
                          <SelectItem
                            key={location.id}
                            value={location.id.toString()}
                          >
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle>Assignment (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Assigned To</Label>
                    <Input
                      id="assignedTo"
                      placeholder="e.g., John Doe"
                      value={formData.assignedTo}
                      onChange={(e) =>
                        handleInputChange('assignedTo', e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignedProject">Assigned Project</Label>
                    <Input
                      id="assignedProject"
                      placeholder="e.g., Metro Line Extension"
                      value={formData.assignedProject}
                      onChange={(e) =>
                        handleInputChange('assignedProject', e.target.value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Link
                      href={`/dashboard/resources/assets/${assetId}`}
                      className="block"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
