'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/shadcn/card';
import { CHART_PALETTE } from '@/components/shadcn/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { routes } from '@/nav';
import type {
  Material,
  MaterialConsumption,
} from '@tornotron/echno-core/materials/types';
import { useOrganizationLowStock } from '@/features/materials/hooks/use-organization-low-stock';

export function StockValueByMaterial({ materials }: { materials: Material[] }) {
  const stockValueData = useMemo(() => {
    const sorted = [...materials]
      .filter((m) => (m.stockValue ?? 0) > 0)
      .toSorted((a, b) => (b.stockValue ?? 0) - (a.stockValue ?? 0))
      .slice(0, 5);
    const total = sorted.reduce((s, m) => s + (m.stockValue ?? 0), 0);
    const max = sorted[0]?.stockValue ?? 0;
    return sorted.map((m, i) => ({
      id: m.id,
      name: m.materialName,
      value: m.stockValue ?? 0,
      pct: total > 0 ? Math.round(((m.stockValue ?? 0) / total) * 100) : 0,
      barPct: max > 0 ? ((m.stockValue ?? 0) / max) * 100 : 0,
      color: CHART_PALETTE[i % CHART_PALETTE.length],
    }));
  }, [materials]);

  return (
    <Card>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Stock Value by Material
        </p>
        <Link
          href={routes.resources.materials.allMaterials}
          className="flex items-center gap-0.5 text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          View report
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <CardContent className="p-4">
        {stockValueData.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No stock value data.
          </p>
        ) : (
          <div className="space-y-3">
            {stockValueData.map((d) => (
              <div key={d.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate text-zinc-700 dark:text-zinc-300">
                    {d.name}
                  </span>
                  <div className="ml-2 flex shrink-0 items-center gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {d.pct}%
                    </span>
                    <span className="font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                      ₹{d.value.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${d.barPct}%`,
                      backgroundColor: d.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LowStockAlert() {
  const { rows, total, hasMoreThanLoaded, isLoading, isError } =
    useOrganizationLowStock();
  const shown = rows.slice(0, 5);

  return (
    <Card>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Low Stock Alert
          </p>
        </div>
        <Link
          href={routes.resources.materials.allMaterials}
          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          View all
        </Link>
      </div>
      <CardContent className="p-4">
        {isLoading && (
          <p className="py-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Checking stock levels...
          </p>
        )}
        {isError && (
          <p className="py-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Stock levels could not be checked. The count is unknown, so none is
            shown.
          </p>
        )}
        {!isLoading && !isError && total === 0 && (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              All materials are well stocked.
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Nothing has reached its reorder level.
            </p>
          </div>
        )}
        {!isLoading && !isError && total !== undefined && total > 0 && (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-orange-600 tabular-nums dark:text-orange-400">
                {total}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {total === 1 ? 'material at or below' : 'materials at or below'}{' '}
                their reorder level
              </span>
            </div>
            <div className="space-y-2.5">
              {shown.map((m) => (
                <div
                  key={m.materialId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate text-zinc-700 dark:text-zinc-300">
                    {m.materialName}
                  </span>
                  <span className="ml-2 shrink-0 text-xs font-medium text-red-600 dark:text-red-400">
                    {m.currentStock} / {m.reorderLevel} {m.unit}
                  </span>
                </div>
              ))}
            </div>
            {total > shown.length && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {hasMoreThanLoaded
                  ? `Showing the ${shown.length} most depleted of ${total}.`
                  : `Showing the ${shown.length} most depleted.`}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TopProjectsConsuming({
  consumptions,
}: {
  consumptions: MaterialConsumption[];
}) {
  const [projectPeriod, setProjectPeriod] = useState<
    'thisMonth' | 'lastMonth' | 'thisYear'
  >('thisMonth');

  const projectData = useMemo(() => {
    const now = new Date();
    const filtered = consumptions.filter((c) => {
      const d = new Date(c.consumptionDate);
      if (projectPeriod === 'thisMonth') {
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      }
      if (projectPeriod === 'lastMonth') {
        const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return (
          d.getFullYear() === last.getFullYear() &&
          d.getMonth() === last.getMonth()
        );
      }
      return d.getFullYear() === now.getFullYear();
    });
    const groups = new Map<string, number>();
    for (const c of filtered) {
      if (c.projectName) {
        groups.set(
          c.projectName,
          (groups.get(c.projectName) ?? 0) + c.quantity
        );
      }
    }
    const total = [...groups.values()].reduce((a, b) => a + b, 0);
    return [...groups.entries()]
      .map(([name, qty], i) => ({
        name,
        qty,
        pct: total > 0 ? Math.round((qty / total) * 100) : 0,
        color: CHART_PALETTE[i % CHART_PALETTE.length],
      }))
      .toSorted((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [consumptions, projectPeriod]);

  return (
    <Card>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Top Projects Consuming
        </p>
        <Select
          value={projectPeriod}
          onValueChange={(v) =>
            setProjectPeriod(v as 'thisMonth' | 'lastMonth' | 'thisYear')
          }
        >
          <SelectTrigger className="h-7 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="thisYear">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <CardContent className="p-4">
        {projectData.length === 0 ? (
          <p className="py-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No consumption data for this period.
          </p>
        ) : (
          <div className="space-y-3">
            {projectData.map((p) => (
              <div key={p.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate text-zinc-700 dark:text-zinc-300">
                    {p.name}
                  </span>
                  <div className="ml-2 flex shrink-0 items-center gap-2">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {p.pct}%
                    </span>
                    <span className="font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                      {p.qty.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${p.pct}%`, backgroundColor: p.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <Link
          href={routes.projects.href}
          className="mt-4 flex items-center gap-0.5 text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          View all projects
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
