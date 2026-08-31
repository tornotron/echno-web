'use client';

import { use, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import {
  Empty,
  EmptyMedia,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { PageHeader } from '@/components/common';
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
  History,
} from 'lucide-react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  useDeleteMaterial,
  useMaterial,
} from '@tornotron/echno-core/materials/hooks';
import { toast } from '@/lib/styles/toast-styles';
import { useMaterialStock } from '@tornotron/echno-core/inventory-transactions/hooks';
import {
  DeleteMaterialDialog,
  MaterialOverviewTab,
  MaterialStockByLocationTab,
  MaterialMovementTimelineTab,
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
      onSuccess: () => {
        toast.success('Material Deleted', {
          description: 'The material has been deleted successfully.',
        });
        router.push(routes.resources.materials.href);
      },
      onError: (error) => {
        toast.error(getErrorTitle(error, 'Failed to Delete Material'), {
          description: getErrorMessage(error),
        });
      },
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
        <Button asChild variant="outline">
          <Link href={routes.resources.materials.href}>Back to Materials</Link>
        </Button>
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
      <PageHeader
        title={material.materialName}
        description={
          <div className="flex flex-wrap items-center gap-2">
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
        }
        actions={
          <>
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
          </>
        }
      />

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
          <TabsTrigger value="movements" className="flex items-center gap-1.5">
            <History className="h-4 w-4" />
            Movement History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <MaterialOverviewTab material={material} />
        </TabsContent>

        <TabsContent value="stock-by-location" className="mt-6 space-y-4">
          <MaterialStockByLocationTab
            materialId={id}
            unit={material.unit}
            globalThresholds={{
              minStock: material.minStock,
              maxStock: material.maxStock,
              safetyStock: material.safetyStock,
              reorderLevel: material.reorderLevel,
              moq: material.moq,
            }}
          />
        </TabsContent>

        <TabsContent value="movements" className="mt-6 space-y-4">
          <MaterialMovementTimelineTab materialId={id} unit={material.unit} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
