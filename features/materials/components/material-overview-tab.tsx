'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Edit,
  Package,
  ShoppingCart,
  AlertTriangle,
  Info,
  WarehouseIcon,
  TrendingDown,
} from 'lucide-react';
import { useMaterialStock } from '@/hooks/inventory-transactions/use-inventory-transactions';
import type { Material } from '@/types/materials';

interface MaterialOverviewTabProps {
  material: Material;
}

export function MaterialOverviewTab({ material }: MaterialOverviewTabProps) {
  const { data: materialStock } = useMaterialStock(material.id);

  const currentStock = material.currentStock;
  const isLowStock =
    currentStock !== undefined &&
    material.reorderLevel !== undefined &&
    currentStock <= material.reorderLevel;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Current Stock</p>
            <WarehouseIcon className="h-4 w-4 text-blue-600" />
          </div>
          <CardContent>
            <div
              className={`text-2xl font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : ''}`}
            >
              {currentStock === undefined ? '—' : currentStock}
            </div>
            <p className="text-muted-foreground text-xs">{material.unit}</p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Stock Value</p>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {material.stockValue === undefined
                ? '—'
                : `₹${material.stockValue.toLocaleString('en-IN')}`}
            </div>
            <p className="text-muted-foreground text-xs">Total stock value</p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">MOQ</p>
            <ShoppingCart className="h-4 w-4 text-orange-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {material.moq === undefined ? '—' : material.moq}
            </div>
            <p className="text-muted-foreground text-xs">Min. order quantity</p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Reorder Level</p>
            <AlertTriangle
              className={`h-4 w-4 ${isLowStock ? 'text-red-600' : 'text-zinc-400'}`}
            />
          </div>
          <CardContent>
            <div
              className={`text-2xl font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : ''}`}
            >
              {material.reorderLevel === undefined
                ? '—'
                : material.reorderLevel}
            </div>
            <p className="text-muted-foreground text-xs">
              Trigger reorder below this
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — 2 cols */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Material Details
              </CardTitle>
              <CardDescription>
                Basic information about this material
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-zinc-500">Name</div>
                <div className="font-medium">{material.materialName}</div>
              </div>
              {material.description && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-zinc-500">Description</div>
                    <div className="font-medium">{material.description}</div>
                  </div>
                </>
              )}
              <Separator />
              <div>
                <div className="text-sm text-zinc-500">Unit of Measure</div>
                <div className="font-medium">{material.unit}</div>
              </div>
              {material.hsn && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-zinc-500">HSN Code</div>
                    <div className="font-medium">{material.hsn}</div>
                  </div>
                </>
              )}
              {material.sku && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-zinc-500">SKU</div>
                    <div className="font-medium">{material.sku}</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Stock Thresholds
              </CardTitle>
              <CardDescription>
                Stock control levels for this material
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm text-zinc-500">Min Stock</div>
                  <div className="font-semibold">
                    {material.minStock === undefined
                      ? '—'
                      : `${material.minStock} ${material.unit}`}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500">Max Stock</div>
                  <div className="font-semibold">
                    {material.maxStock === undefined
                      ? '—'
                      : `${material.maxStock} ${material.unit}`}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500">Safety Stock</div>
                  <div className="font-semibold">
                    {material.safetyStock === undefined
                      ? '—'
                      : `${material.safetyStock} ${material.unit}`}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500">Reorder Level</div>
                  <div
                    className={`font-semibold ${isLowStock ? 'text-red-600 dark:text-red-400' : ''}`}
                  >
                    {material.reorderLevel === undefined
                      ? '—'
                      : `${material.reorderLevel} ${material.unit}`}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500">MOQ</div>
                  <div className="font-semibold">
                    {material.moq === undefined
                      ? '—'
                      : `${material.moq} ${material.unit}`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link
                  href={`/users/dashboard/resources/materials/${material.id}/edit`}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Material
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/users/dashboard/resources/material-consumptions/new">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Record Consumption
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/users/dashboard/resources/purchase-orders/new">
                  <Package className="mr-2 h-4 w-4" />
                  Create Purchase Order
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Current Stock
                </span>
                <span
                  className={`font-medium ${isLowStock ? 'text-red-600' : ''}`}
                >
                  {currentStock === undefined
                    ? '—'
                    : `${currentStock} ${material.unit}`}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Opening Stock
                </span>
                <span className="font-medium">
                  {material.openingStock === undefined
                    ? '—'
                    : `${material.openingStock} ${material.unit}`}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Stock Value
                </span>
                <span className="font-medium">
                  {material.stockValue === undefined
                    ? '—'
                    : `₹${material.stockValue.toLocaleString('en-IN')}`}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Locations
                </span>
                <span className="font-medium">
                  {materialStock?.locationStock.length ?? '—'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
