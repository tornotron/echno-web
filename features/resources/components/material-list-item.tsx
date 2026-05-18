import Link from 'next/link';
import { routes } from '@/nav';
import { Badge } from '@/components/shadcn/badge';
import { Package } from 'lucide-react';
import type { Material } from '@/types/materials';

interface MaterialListItemProps {
  material: Material;
}

export function MaterialListItem({ material }: MaterialListItemProps) {
  return (
    <Link
      href={routes.resources.materials.detail(material.id).href}
      className="block"
    >
      <div className="rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-blue-600">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {material.materialName}
                  </h3>
                  {material.sku && (
                    <span className="text-xs text-zinc-500">
                      {material.sku}
                    </span>
                  )}
                </div>
                {material.description && (
                  <p className="mt-1 line-clamp-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {material.description}
                  </p>
                )}
                {material.hsn && (
                  <p className="mt-0.5 text-xs text-zinc-500">
                    HSN: {material.hsn}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Badge variant="outline" className="shrink-0 self-start lg:self-auto">
            {material.unit}
          </Badge>

          <div className="grid grid-cols-3 gap-4 lg:w-auto">
            <div className="text-center">
              <div className="mb-1 text-xs text-zinc-500">Current Stock</div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {material.currentStock === undefined
                  ? '—'
                  : `${material.currentStock} ${material.unit}`}
              </div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-xs text-zinc-500">Stock Value</div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {material.stockValue === undefined
                  ? '—'
                  : `₹${material.stockValue.toLocaleString('en-IN')}`}
              </div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-xs text-zinc-500">Reorder At</div>
              <div
                className={`text-sm font-semibold ${
                  material.reorderLevel !== undefined &&
                  material.currentStock !== undefined &&
                  material.currentStock <= material.reorderLevel
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {material.reorderLevel === undefined
                  ? '—'
                  : material.reorderLevel}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
