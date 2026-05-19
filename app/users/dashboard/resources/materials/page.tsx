'use client';

import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { useMaterials, useAllMaterialConsumptions } from '@/hooks/materials';
import {
  MaterialsKpiStrip,
  MaterialsChartsRow,
  MaterialsInsightsRow,
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
      />

      {/* Full-width sections */}
      <MaterialsKpiStrip materials={materials} />
      <MaterialsChartsRow materials={materials} consumptions={consumptions} />

      <MaterialsInsightsRow materials={materials} consumptions={consumptions} />
      <RecentStockMovements consumptions={consumptions} />
    </div>
  );
}
