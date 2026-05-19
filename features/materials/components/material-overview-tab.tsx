'use client';

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
import { Separator } from '@/components/shadcn/separator';
import {
  Edit,
  Package,
  ShoppingCart,
  AlertTriangle,
  Info,
  WarehouseIcon,
  BarChart3,
  IndianRupee,
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
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Current Stock
            </p>
            <div className="flex items-center justify-between">
              <p
                className={`text-2xl font-bold tracking-tight ${
                  isLowStock
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {currentStock === undefined ? '—' : currentStock}
              </p>
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                  isLowStock
                    ? 'bg-red-50 dark:bg-red-950/30'
                    : 'bg-zinc-100 dark:bg-zinc-800'
                }`}
              >
                <WarehouseIcon
                  className={`size-4 ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-zinc-600 dark:text-zinc-400'}`}
                />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {material.unit}
            </p>
          </div>

          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Stock Value
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {material.stockValue === undefined
                  ? '—'
                  : `₹${material.stockValue.toLocaleString('en-IN')}`}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <BarChart3 className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              total stock value
            </p>
          </div>

          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">MOQ</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                {material.moq === undefined ? '—' : material.moq}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <IndianRupee className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              min. order quantity
            </p>
          </div>

          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Reorder Level
            </p>
            <div className="flex items-center justify-between">
              <p
                className={`text-2xl font-bold tracking-tight ${
                  isLowStock
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {material.reorderLevel === undefined
                  ? '—'
                  : material.reorderLevel}
              </p>
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                  isLowStock
                    ? 'bg-red-50 dark:bg-red-950/30'
                    : 'bg-zinc-100 dark:bg-zinc-800'
                }`}
              >
                <AlertTriangle
                  className={`size-4 ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-zinc-400'}`}
                />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              trigger reorder below this
            </p>
          </div>
        </div>
      </Card>

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
                  href={routes.resources.materials.detail(material.id).edit}
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
                <Link href={routes.resources.materialConsumptions.new}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Record Consumption
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href={routes.resources.purchaseOrders.new}>
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
