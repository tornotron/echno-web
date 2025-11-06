'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from "@/components/common/app-layout";
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
  Calendar,
  DollarSign,
  Box,
  Building2,
  Tag,
  Clock,
  FileText,
  Activity,
  BarChart3,
  ArrowUpDown
} from 'lucide-react';
import { 
  InventoryItem,
  getStockStatus,
  getStockStatusColor,
  inventoryCategoryLabels 
} from '@/types/resource/inventory';
import { locationTypeLabels } from '@/types/resource/location';
import { mockInventoryItems, mockStockHistory, getVendorById } from '@/lib/mock-data';

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = Number(params.id);

  // In real app, fetch from API
  const item = mockInventoryItems.find(i => i.id === itemId);

  if (!item) {
    return (
      <AppLayout>
        <div className="px-4 py-8 space-y-6">
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Inventory Item Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The inventory item you're looking for doesn't exist.
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
      <div className="px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{item.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {item.itemId}
              </Badge>
              <Badge variant={
                stockStatus === 'out-of-stock' ? 'destructive' :
                stockStatus === 'low' ? 'secondary' :
                'default'
              }>
                {stockStatus === 'out-of-stock' ? 'Out of Stock' :
                 stockStatus === 'low' ? 'Low Stock' :
                 stockStatus === 'excess' ? 'Excess Stock' :
                 'In Stock'}
              </Badge>
              <Badge variant="outline">
                {inventoryCategoryLabels[item.category as keyof typeof inventoryCategoryLabels]}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/resources/inventory/${item.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content - Left Side (2 columns) */}
          <div className="md:col-span-2 space-y-6">
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
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1">{item.description}</p>
                </div>
                {item.specifications && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Specifications</label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {Object.entries(item.specifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-sm">{value}</span>
                        </div>
                      ))}
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Current Stock Level</span>
                    <span className="text-2xl font-bold">{item.quantity} {item.unit}</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        stockStatus === 'out-of-stock' ? 'bg-red-500' :
                        stockStatus === 'low' ? 'bg-orange-500' :
                        stockStatus === 'optimal' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>0</span>
                    <span>{stockPercentage.toFixed(0)}% of capacity</span>
                    <span>{item.maxStockLevel}</span>
                  </div>
                </div>

                {/* Stock Levels Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingDown className="h-4 w-4" />
                      <span className="text-xs font-medium">Min Level</span>
                    </div>
                    <div className="text-xl font-bold">{item.minStockLevel}</div>
                    <div className="text-xs text-muted-foreground">{item.unit}</div>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs font-medium">Reorder Point</span>
                    </div>
                    <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{item.reorderPoint}</div>
                    <div className="text-xs text-muted-foreground">{item.unit}</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Max Level</span>
                    </div>
                    <div className="text-xl font-bold">{item.maxStockLevel}</div>
                    <div className="text-xs text-muted-foreground">{item.unit}</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Adjust Stock
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MapPin className="h-4 w-4 mr-2" />
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
                <CardDescription>Recent stock changes and adjustments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockStockHistory.map((history, index) => (
                    <div key={history.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          history.type === 'restock' ? 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400' :
                          history.type === 'usage' ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400' :
                          'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400'
                        }`}>
                          {history.type === 'restock' ? '+' : history.type === 'usage' ? '-' : '~'}
                        </div>
                        {index < mockStockHistory.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <div className="font-medium">
                              {history.type === 'restock' ? 'Stock Replenishment' :
                               history.type === 'usage' ? 'Stock Usage' :
                               'Stock Adjustment'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {history.quantity > 0 ? '+' : ''}{history.quantity} {item.unit} • {history.previousQuantity} → {history.newQuantity}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {history.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
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
                  <div className="text-sm text-muted-foreground">
                    {item.location.address}
                  </div>
                )}
                {item.location.capacity && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">Capacity</div>
                    <div className="text-sm font-medium">{item.location.capacity.toLocaleString()} units</div>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/dashboard/resources/locations/${item.locationId}`}>
                    <Building2 className="h-4 w-4 mr-2" />
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
                  <div className="text-xs text-muted-foreground">Unit Price</div>
                  <div className="text-xl font-bold">₹{item.unitPrice}</div>
                  <div className="text-xs text-muted-foreground">per {item.unit}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-xs text-muted-foreground">Total Stock Value</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{(item.totalValue / 1000).toFixed(1)}K
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.quantity} {item.unit} × ₹{item.unitPrice}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vendor Card */}
            {item.vendorId && (() => {
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
                      <div className="text-xs text-muted-foreground">Vendor</div>
                      <div className="font-medium">{vendor.companyName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Contact Person</div>
                      <div className="font-medium">{vendor.contactPerson}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Phone</div>
                      <div className="font-medium">{vendor.phone}</div>
                    </div>
                    {item.brand && (
                      <div>
                        <div className="text-xs text-muted-foreground">Brand</div>
                        <div className="font-medium">{item.brand}</div>
                      </div>
                    )}
                    {item.batchNumber && (
                      <div>
                        <div className="text-xs text-muted-foreground">Batch Number</div>
                        <div className="font-mono text-sm">{item.batchNumber}</div>
                      </div>
                    )}
                    <Button variant="outline" size="sm" asChild className="w-full mt-2">
                      <Link href={`/dashboard/third-party/vendors/${vendor.id}`}>
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
                    <div className="text-xs text-muted-foreground">Last Restocked</div>
                    <div className="text-sm font-medium">
                      {item.lastRestockedDate.toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                )}
                {item.lastUsedDate && (
                  <div>
                    <div className="text-xs text-muted-foreground">Last Used</div>
                    <div className="text-sm font-medium">
                      {item.lastUsedDate.toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                )}
                {item.expiryDate && (
                  <div>
                    <div className="text-xs text-muted-foreground">Expiry Date</div>
                    <div className="text-sm font-medium text-red-600 dark:text-red-400">
                      {item.expiryDate.toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Created {item.createdAt.toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
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
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
