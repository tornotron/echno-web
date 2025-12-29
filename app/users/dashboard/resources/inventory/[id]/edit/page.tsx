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
import { AppLayout } from '@/components/common/app-layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Package, Save, X } from 'lucide-react';
import {
  InventoryCategory,
  inventoryCategoryLabels,
} from '@/types/resource/inventory';
import { toast } from 'sonner';
import {
  mockLocations,
  mockInventoryItems,
  mockVendors,
} from '@/components/shared/mock-data';

export default function EditInventoryPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = Number(params.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '' as InventoryCategory | '',
    quantity: '',
    unit: '',
    minStockLevel: '',
    maxStockLevel: '',
    reorderPoint: '',
    locationId: '',
    unitPrice: '',
    vendorId: '',
    brand: '',
    batchNumber: '',
    notes: '',
  });

  useEffect(() => {
    // In real app, fetch from API
    const item = mockInventoryItems.find((i) => i.id === itemId);
    if (item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: item.name,
        description: item.description || '',
        category: item.category as InventoryCategory,
        quantity: item.quantity.toString(),
        unit: item.unit,
        minStockLevel: item.minStockLevel.toString(),
        maxStockLevel: item.maxStockLevel.toString(),
        reorderPoint: item.reorderPoint.toString(),
        locationId: item.locationId.toString(),
        unitPrice: item.unitPrice.toString(),
        vendorId: item.vendorId?.toString() || '',
        brand: item.brand || '',
        batchNumber: item.batchNumber || '',
        notes: item.notes || '',
      });
    }
    setIsLoading(false);
  }, [itemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validation
    if (
      !formData.name ||
      !formData.category ||
      !formData.quantity ||
      !formData.unit ||
      !formData.locationId
    ) {
      toast.error('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    // In real app, make API call
    setTimeout(() => {
      toast.success('Inventory item updated successfully!');
      router.push(`/dashboard/resources/inventory/${itemId}`);
    }, 1000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4 sm:space-y-6">
          <div className="py-12 text-center">
            <Package className="text-muted-foreground mx-auto mb-4 h-12 w-12 animate-pulse" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link
                  href={`/app/users/dashboard/resources/inventory/${itemId}`}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back
                </Link>
              </Button>
              <span className="text-muted-foreground">/</span>
              <h1 className="text-2xl font-bold">Edit Inventory Item</h1>
            </div>
            <p className="text-muted-foreground mb-4">
              The item you&apos;re looking for doesn&apos;t exist.
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
                    Edit the basic details of the inventory item
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="name">
                        Item Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g., Portland Cement - Grade 53"
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
                        placeholder="Enter item description..."
                        value={formData.description}
                        onChange={(e) =>
                          handleInputChange('description', e.target.value)
                        }
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">
                        Category <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          handleInputChange('category', value)
                        }
                        required
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(inventoryCategoryLabels).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit">
                        Unit <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="unit"
                        placeholder="e.g., bags, pieces, meters"
                        value={formData.unit}
                        onChange={(e) =>
                          handleInputChange('unit', e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stock Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Stock Management</CardTitle>
                  <CardDescription>
                    Update stock levels and thresholds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">
                        Current Quantity <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.quantity}
                        onChange={(e) =>
                          handleInputChange('quantity', e.target.value)
                        }
                        required
                      />
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
                          <SelectItem value="new" className="text-blue-600">
                            + Add New Location
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
                      <Input
                        id="minStockLevel"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.minStockLevel}
                        onChange={(e) =>
                          handleInputChange('minStockLevel', e.target.value)
                        }
                      />
                      <p className="text-muted-foreground text-xs">
                        Below this level triggers low stock warning
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxStockLevel">Maximum Stock Level</Label>
                      <Input
                        id="maxStockLevel"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.maxStockLevel}
                        onChange={(e) =>
                          handleInputChange('maxStockLevel', e.target.value)
                        }
                      />
                      <p className="text-muted-foreground text-xs">
                        Maximum capacity for this item
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reorderPoint">Reorder Point</Label>
                      <Input
                        id="reorderPoint"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.reorderPoint}
                        onChange={(e) =>
                          handleInputChange('reorderPoint', e.target.value)
                        }
                      />
                      <p className="text-muted-foreground text-xs">
                        When to reorder stock
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Details</CardTitle>
                  <CardDescription>
                    Update vendor and tracking information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="unitPrice">Unit Price (₹)</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.unitPrice}
                        onChange={(e) =>
                          handleInputChange('unitPrice', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vendorId">Vendor</Label>
                      <Select
                        value={formData.vendorId}
                        onValueChange={(value) =>
                          handleInputChange('vendorId', value)
                        }
                      >
                        <SelectTrigger id="vendorId">
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockVendors.map((vendor) => (
                            <SelectItem
                              key={vendor.id}
                              value={vendor.id.toString()}
                            >
                              {vendor.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        placeholder="e.g., UltraTech"
                        value={formData.brand}
                        onChange={(e) =>
                          handleInputChange('brand', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="batchNumber">Batch Number</Label>
                      <Input
                        id="batchNumber"
                        placeholder="e.g., UT-2024-11-001"
                        value={formData.batchNumber}
                        onChange={(e) =>
                          handleInputChange('batchNumber', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Additional notes or instructions..."
                        value={formData.notes}
                        onChange={(e) =>
                          handleInputChange('notes', e.target.value)
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar - Right Side (1 column) */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Item ID</span>
                      <span className="font-mono font-medium">INV-001</span>
                    </div>
                    {formData.quantity && formData.unitPrice && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Quantity
                          </span>
                          <span className="font-medium">
                            {formData.quantity} {formData.unit || 'units'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Unit Price
                          </span>
                          <span className="font-medium">
                            ₹{formData.unitPrice}
                          </span>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground text-sm">
                              Total Value
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              ₹
                              {(
                                Number(formData.quantity) *
                                Number(formData.unitPrice)
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
                <CardHeader>
                  <CardTitle className="text-base text-amber-900 dark:text-amber-100">
                    Important Note
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                  <p>Changes to quantity will be tracked in stock history.</p>
                  <p>
                    Consider using &quot;Adjust Stock&quot; for better tracking
                    of stock movements.
                  </p>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
