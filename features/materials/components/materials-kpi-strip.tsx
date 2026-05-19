import Link from 'next/link';
import {
  Layers,
  WarehouseIcon,
  BarChart2,
  ChevronRight,
  ClipboardList,
  ShoppingCart,
} from 'lucide-react';
import { Card } from '@/components/shadcn/card';
import { routes } from '@/nav';
import type { Material } from '@/types/materials';

interface MaterialsKpiStripProps {
  materials: Material[];
}

function formatStockValue(v: number): string {
  if (v >= 10_000_000) return `₹${(v / 10_000_000).toFixed(1)}Cr`;
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
}

const QUICK_ACTIONS = [
  {
    icon: Layers,
    label: 'All Materials',
    href: routes.resources.materials.allMaterials,
  },
  {
    icon: ClipboardList,
    label: 'Create Indent',
    href: routes.resources.indents.new,
  },
  {
    icon: ShoppingCart,
    label: 'Create PO',
    href: routes.resources.purchaseOrders.new,
  },
];

export function MaterialsKpiStrip({ materials }: MaterialsKpiStripProps) {
  const totalMaterials = materials.length;
  const totalStockValue = materials.reduce(
    (s, m) => s + (m.stockValue ?? 0),
    0
  );

  const availPairs = materials.filter(
    (m) =>
      m.maxStock !== undefined && m.maxStock > 0 && m.currentStock !== undefined
  );
  const avgAvailability =
    availPairs.length > 0
      ? availPairs.reduce(
          (s, m) => s + ((m.currentStock ?? 0) / m.maxStock!) * 100,
          0
        ) / availPairs.length
      : null;

  return (
    <Card className="gap-0 p-6">
      <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
        {/* Total Materials */}
        <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Total Materials
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {totalMaterials}
            </p>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Layers className="size-4 text-zinc-600 dark:text-zinc-400" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            across all categories
          </p>
        </div>

        {/* Total Stock Value */}
        <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Total Stock Value
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {totalStockValue > 0 ? formatStockValue(totalStockValue) : '—'}
            </p>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <WarehouseIcon className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            current inventory value
          </p>
        </div>

        {/* Avg. Stock Availability */}
        <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Avg. Stock Availability
          </p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
              {avgAvailability === null
                ? '—'
                : `${Math.round(avgAvailability)}%`}
            </p>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
              <BarChart2 className="size-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            across all materials
          </p>
        </div>

        {/* Quick Actions */}
        <div className="col-span-2 rounded-lg p-3 sm:col-span-1 sm:rounded-none sm:pl-6">
          <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Quick Actions
          </p>
          <div className="space-y-0.5">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="group hover:bg-muted/60 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
              >
                <action.icon className="size-3.5 shrink-0 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
                <span className="flex-1 text-xs text-zinc-700 dark:text-zinc-300">
                  {action.label}
                </span>
                <ChevronRight className="size-3 text-zinc-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
