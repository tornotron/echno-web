'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/common/app-layout';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  MapPin,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Trash2,
  ArrowLeft,
  DollarSign,
  Building2,
  Clock,
  FileText,
  Activity,
  BarChart3,
  ArrowUpDown,
} from 'lucide-react';
import {
  getStockStatus,
  inventoryCategoryLabels,
} from '@/types/resource/inventory';
import { locationTypeLabels } from '@/types/resource/location';
import {
  mockInventoryItems,
  mockStockHistory,
  getVendorById,
} from '@/components/shared/mock-data';

export default function InventoryDetailPage() {
  const params = useParams();

  const { id } = params;
  const itemId = Number.parseInt(id as string);

  // In real app, fetch from API
  const item = mockInventoryItems.find((i) => i.id === itemId);

  if (!item) {
    return (
      <AppLayout>
        <div className="space-y-4 sm:space-y-6">
          <div className="py-12 text-center">
            <Package className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">
              Inventory Item Not Found
            </h3>
            <p className="text-muted-foreground mb-4">
              The item you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button asChild>
              <Link href="/dashboard/resources/inventory">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Inventory
              </Link>
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const stockStatus = getStockStatus(item);
  const stockPercentage = (item.quantity / item.maxStockLevel) * 100;

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{item.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {item.itemId}
              </Badge>
              <Badge variant={getStockBadgeVariant(stockStatus)}>
                {stockStatusLabels[stockStatus]}
              </Badge>
              <Badge variant="outline">
                {
                  inventoryCategoryLabels[
                    item.category as keyof typeof inventoryCategoryLabels
                  ]
                }
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/resources/inventory/${item.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content - Left Side (2 columns) */}
          <div className="space-y-6 md:col-span-2">
            {/* Item Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Item Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Description
                  </label>
                  <p className="mt-1">{item.description}</p>
                </div>
                {item.specifications && (
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">
                      Specifications
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {Object.entries(item.specifications).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
                          >
                            <span className="text-sm font-medium capitalize">
                              {key.replaceAll(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-sm">{String(value)}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stock Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Stock Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Stock Level */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Current Stock Level
                    </span>
                    <span className="text-2xl font-bold">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                    <div
                      className={`h-full transition-all ${getStockColor(stockStatus)}`}
                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-muted-foreground mt-1 flex items-center justify-between text-xs">
                    <span>0</span>
                    <span>{stockPercentage.toFixed(0)}% of capacity</span>
                    <span>{item.maxStockLevel}</span>
                  </div>
                </div>

                {/* Stock Levels Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-muted-foreground mb-1 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      <span className="text-xs font-medium">Min Level</span>
                    </div>
                    <div className="text-xl font-bold">
                      {item.minStockLevel}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {item.unit}
                    </div>
                  </div>
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-900 dark:bg-orange-950/20">
                    <div className="mb-1 flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs font-medium">Reorder Point</span>
                    </div>
                    <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {item.reorderPoint}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {item.unit}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-muted-foreground mb-1 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Max Level</span>
                    </div>
                    <div className="text-xl font-bold">
                      {item.maxStockLevel}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {item.unit}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Adjust Stock
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MapPin className="mr-2 h-4 w-4" />
                    Transfer
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stock History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Stock Movement History
                </CardTitle>
                <CardDescription>
                  Recent stock changes and adjustments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockStockHistory.map((history, index) => (
                    <div key={history.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                          {getHistoryIcon(history.type)}
                        </div>
                        {index < mockStockHistory.length - 1 && (
                          <div className="bg-border mt-2 h-full w-0.5" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="mb-1 flex items-start justify-between">
                          <div>
                            <div className="font-medium">
                              {history.type === 'restock'
                                ? 'Stock Replenishment'
                                : history.type === 'usage'
                                  ? 'Stock Usage'
                                  : 'Stock Adjustment'}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {history.quantity > 0 ? '+' : ''}
                              {history.quantity} {item.unit} •{' '}
                              {history.previousQuantity} → {history.newQuantity}
                            </div>
                          </div>
                          <div className="text-muted-foreground text-sm">
                            {history.date.toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                        <div className="text-muted-foreground text-sm">
                          By {history.performedBy} • {history.notes}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Side (1 column) */}
          <div className="space-y-6">
            {/* Location Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-semibold">{item.location.name}</div>
                  <Badge variant="outline" className="mt-1">
                    {locationTypeLabels[item.location.type]}
                  </Badge>
                </div>
                {item.location.address && (
                  <div className="text-muted-foreground text-sm">
                    {item.location.address}
                  </div>
                )}
                {item.location.capacity && (
                  <div className="border-t pt-2">
                    <div className="text-muted-foreground text-xs">
                      Capacity
                    </div>
                    <div className="text-sm font-medium">
                      {item.location.capacity.toLocaleString()} units
                    </div>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link
                    href={`/dashboard/resources/locations/${item.locationId}`}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    View Location
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pricing Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-muted-foreground text-xs">
                    Unit Price
                  </div>
                  <div className="text-xl font-bold">₹{item.unitPrice}</div>
                  <div className="text-muted-foreground text-xs">
                    per {item.unit}
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="text-muted-foreground text-xs">
                    Total Stock Value
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {' '}
                    ₹{(item.totalValue / 1000).toFixed(1)}K
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {item.quantity} {item.unit} × ₹{item.unitPrice}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vendor Card */}
            {item.vendorId &&
              (() => {
                const vendor = getVendorById(item.vendorId);
                return vendor ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 className="h-4 w-4" />
                        Vendor Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Vendor
                        </div>
                        <div className="font-medium">{vendor.companyName}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Contact Person
                        </div>
                        <div className="font-medium">
                          {vendor.contactPerson}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">
                          Phone
                        </div>
                        <div className="font-medium">{vendor.phone}</div>
                      </div>
                      {item.brand && (
                        <div>
                          <div className="text-muted-foreground text-xs">
                            Brand
                          </div>
                          <div className="font-medium">{item.brand}</div>
                        </div>
                      )}
                      {item.batchNumber && (
                        <div>
                          <div className="text-muted-foreground text-xs">
                            Batch Number
                          </div>
                          <div className="font-mono text-sm">
                            {item.batchNumber}
                          </div>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="mt-2 w-full"
                      >
                        <Link
                          href={`/dashboard/third-party/vendors/${vendor.id}`}
                        >
                          View Vendor Details
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : null;
              })()}

            {/* Dates Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  Important Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.lastRestockedDate && (
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Last Restocked
                    </div>
                    <div className="text-sm font-medium">
                      {item.lastRestockedDate.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                )}
                {item.lastUsedDate && (
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Last Used
                    </div>
                    <div className="text-sm font-medium">
                      {item.lastUsedDate.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                )}
                {item.expiryDate && (
                  <div>
                    <div className="text-muted-foreground text-xs">
                      Expiry Date
                    </div>
                    <div className="text-sm font-medium text-red-600 dark:text-red-400">
                      {item.expiryDate.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                )}
                <div className="text-muted-foreground border-t pt-2 text-xs">
                  Created{' '}
                  {item.createdAt.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Notes Card */}
            {item.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{item.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

const getStockColor = (status: string) => {
  switch (status) {
    case 'out-of-stock': {
      return 'bg-red-500';
    }
    case 'low': {
      return 'bg-orange-500';
    }
    case 'optimal': {
      return 'bg-green-500';
    }
    case 'excess': {
      return 'bg-blue-500';
    }
    default: {
      return 'bg-blue-500';
    }
  }
};

const getHistoryIcon = (type: string) => {
  switch (type) {
    case 'restock': {
      return '+';
    }
    case 'usage': {
      return '-';
    }
    default: {
      return '~';
    }
  }
};

const getStockBadgeVariant = (status: string) => {
  switch (status) {
    case 'out-of-stock': {
      return 'destructive';
    }
    case 'low': {
      return 'secondary';
    }
    case 'excess': {
      return 'outline';
    }
    default: {
      return 'default';
    }
  }
};

const stockStatusLabels: Record<string, string> = {
  'out-of-stock': 'Out of Stock',
  low: 'Low Stock',
  excess: 'Excess Stock',
  optimal: 'In Stock',
};
