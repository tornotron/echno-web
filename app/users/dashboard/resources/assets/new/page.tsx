'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Save, X } from 'lucide-react';
import { AssetType, AssetStatus, AssetCondition } from '@/types/resource';
import { toast } from '@/lib/styles/toast-styles';
import { mockLocations } from '@/components/shared/mock-data';

export default function NewAssetPage() {
  const router = useRouter();
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
    maintenanceSchedule: '',
    maxUsageHours: '',
    fuelType: '',
    insuranceProvider: '',
    policyNumber: '',
    insuranceExpiry: '',
    notes: '',
  });

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
      toast.success('Asset registered successfully!');
      router.push(routes.resources.assets.href);
    }, 1000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Register New Asset</h1>
          <p className="text-muted-foreground">
            Add a new asset to your inventory
          </p>
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
                  Enter the basic details of the asset
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">Asset Name</Label>
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
                    <Label htmlFor="type">Asset Type</Label>
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
                        <SelectItem value="computer">Computer & IT</SelectItem>
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
                        handleInputChange('registrationNumber', e.target.value)
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
                      Purchase Price (₹) <span className="text-red-500">*</span>
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

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="maintenanceSchedule">
                      Maintenance Schedule
                    </Label>
                    <Input
                      id="maintenanceSchedule"
                      placeholder="e.g., Every 500 hours"
                      value={formData.maintenanceSchedule}
                      onChange={(e) =>
                        handleInputChange('maintenanceSchedule', e.target.value)
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
                    onChange={(e) => handleInputChange('notes', e.target.value)}
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
                    {isSubmitting ? 'Saving...' : 'Register Asset'}
                  </Button>
                  <Link href={routes.resources.assets.href} className="block">
                    <Button type="button" variant="outline" className="w-full">
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
  );
}
