import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Badge } from '@/components/shadcn/badge';
import { routes } from '@/nav';
import type { MaterialConsumption } from '@tornotron/echno-core/materials/types';

interface RecentStockMovementsProps {
  consumptions: MaterialConsumption[];
}

export function RecentStockMovements({
  consumptions,
}: RecentStockMovementsProps) {
  const recent = [...consumptions]
    .toSorted(
      (a, b) =>
        new Date(b.consumptionDate).getTime() -
        new Date(a.consumptionDate).getTime()
    )
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Recent Stock Movements
        </p>
        <Link
          href={routes.resources.materialConsumptions.href}
          className="flex items-center gap-0.5 text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          View all movements
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {recent.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No stock movements recorded yet.
          </p>
        ) : (
          <div className="divide-y">
            {recent.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {c.materialName}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {c.projectName ?? c.storageLocationName ?? '—'}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 gap-1 border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400"
                >
                  Stock Out
                </Badge>
                <span className="shrink-0 text-zinc-700 tabular-nums dark:text-zinc-300">
                  {c.quantity}
                </span>
                <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                  {new Date(c.consumptionDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <span className="max-w-[96px] truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {c.createdBy.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
