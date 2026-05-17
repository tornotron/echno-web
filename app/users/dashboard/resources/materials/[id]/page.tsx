'use client';

import { use, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Card, CardContent } from '@/components/shadcn/card';
import {
  Empty,
  EmptyMedia,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/shadcn/tabs';
import {
  Edit,
  Loader2,
  Trash2,
  Package,
  WarehouseIcon,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { useMaterial, useDeleteMaterial } from '@/hooks/materials';
import { useMaterialStock } from '@/hooks/inventory-transactions/use-inventory-transactions';
import {
  DeleteMaterialDialog,
  MaterialOverviewTab,
  MaterialStockByLocationTab,
} from '@/features/materials/components';

export default function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = use(params);
  const id = Number(rawId);
  const router = useRouter();

  const { data: material, isLoading, isError } = useMaterial(id);
  const { data: materialStock } = useMaterialStock(id);
  const { mutate: deleteMaterial, isPending: isDeleting } = useDeleteMaterial();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = useCallback(() => {
    deleteMaterial(id, {
      onSuccess: () => router.push(routes.resources.materials.href),
    });
  }, [deleteMaterial, id, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-zinc-400" />
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading material...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <Package className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Failed to load material</EmptyTitle>
          <EmptyDescription>An unexpected error occurred.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!material) {
    return (
      <Empty variant="default">
        <EmptyMedia variant="icon">
          <Package className="size-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Material not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or the link is invalid.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline">
          <Link href={routes.resources.materials.href}>Back to Materials</Link>
        </Button>
      </Empty>
    );
  }

  const isLowStock =
    material.currentStock !== undefined &&
    material.reorderLevel !== undefined &&
    material.currentStock <= material.reorderLevel;

  return (
    <div className="space-y-4 sm:space-y-6">
      <DeleteMaterialDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        materialName={material.materialName}
        isPending={isDeleting}
        onConfirm={handleDelete}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {material.materialName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {material.sku && (
              <Badge variant="outline" className="text-xs">
                <Tag className="mr-1 h-3 w-3" />
                {material.sku}
              </Badge>
            )}
            {material.hsn && (
              <Badge variant="outline" className="text-xs">
                HSN: {material.hsn}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {material.unit}
            </Badge>
            {isLowStock && (
              <Badge className="bg-red-100 text-xs text-red-700 dark:bg-red-900 dark:text-red-300">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Low Stock
              </Badge>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.resources.materials.detail(id).edit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Material
            </Link>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            aria-label="Delete material"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <Package className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="stock-by-location"
            className="flex items-center gap-1.5"
          >
            <WarehouseIcon className="h-4 w-4" />
            Stock by Location
            {materialStock && materialStock.locationStock.length > 0 && (
              <span className="ml-1 rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs font-medium dark:bg-zinc-700">
                {materialStock.locationStock.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <MaterialOverviewTab material={material} />
        </TabsContent>

        <TabsContent value="stock-by-location" className="mt-6 space-y-4">
          <MaterialStockByLocationTab
            materialId={id}
            unit={material.unit}
            reorderLevel={material.reorderLevel}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
