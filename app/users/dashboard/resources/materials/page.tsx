'use client';

import Link from 'next/link';
import { Loader2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { routes } from '@/nav';
import { useMaterials } from '@/hooks/materials';
import { useAllMaterialConsumptions } from '@/hooks/material-consumptions';
import {
  MaterialsKpiStrip,
  MaterialsDashboardTable,
  StockValueByMaterial,
  LowStockAlert,
  TopProjectsConsuming,
  RecentStockMovements,
} from '@/features/materials/components';

export default function MaterialsPage() {
  const { data: materials = [], isLoading, isError } = useMaterials();
  const { data: consumptions = [] } = useAllMaterialConsumptions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-zinc-500">
          Failed to load materials. Please refresh the page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Materials"
        description="Manage and track all materials in your inventory"
        actions={
          <Button asChild>
            <Link href={routes.resources.materials.new}>
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Link>
          </Button>
        }
      />

      <MaterialsKpiStrip materials={materials} consumptions={consumptions} />

      <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start">
        {/* Main column */}
        <div className="min-w-0 flex-1 space-y-4 sm:space-y-6">
          <MaterialsDashboardTable materials={materials} />
          <RecentStockMovements consumptions={consumptions} />
        </div>

        {/* Right sidebar */}
        <div className="w-full shrink-0 space-y-4 lg:w-72 xl:w-80">
          <StockValueByMaterial materials={materials} />
          <LowStockAlert materials={materials} />
          <TopProjectsConsuming consumptions={consumptions} />
        </div>
      </div>
    </div>
  );
}
