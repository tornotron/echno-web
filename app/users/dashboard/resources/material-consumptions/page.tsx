'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { routes } from '@/nav';
import { Card } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { PageHeader } from '@/components/common';
import {
  Plus,
  Loader2,
  FlameKindling,
  CalendarDays,
  Package,
  BarChart3,
} from 'lucide-react';
import { useAllMaterialConsumptions } from '@/hooks/materials';
import { ConsumptionTable } from '@/features/material-consumptions/components';
import { ConsumptionType } from '@/types/materials';

export default function MaterialConsumptionsPage() {
  const { data: consumptions = [], isLoading } = useAllMaterialConsumptions();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ConsumptionType | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return consumptions.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.materialName.toLowerCase().includes(q) ||
        c.projectName?.toLowerCase().includes(q) ||
        c.taskTitle?.toLowerCase().includes(q) ||
        c.createdBy.name.toLowerCase().includes(q);
      const matchesType =
        typeFilter === 'all' || c.consumptionType === typeFilter;
      const matchesProject =
        projectFilter === 'all' || c.projectName === projectFilter;
      return matchesSearch && matchesType && matchesProject;
    });
  }, [consumptions, searchQuery, typeFilter, projectFilter]);

  const projectOptions = useMemo(() => {
    const names = new Set<string>();
    for (const c of consumptions) {
      if (c.projectName) names.add(c.projectName);
    }
    return [...names].toSorted();
  }, [consumptions]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const now = new Date();
  const thisMonth = consumptions.filter((c) => {
    const d = new Date(c.consumptionDate);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const totalQty = consumptions.reduce((sum, c) => sum + c.quantity, 0);
  const uniqueMaterials = new Set(consumptions.map((c) => c.materialId)).size;

  const hasActiveFilters =
    !!searchQuery || typeFilter !== 'all' || projectFilter !== 'all';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Material Consumptions"
        description="Track material usage across projects and tasks"
        actions={
          <Button asChild>
            <Link href={routes.resources.materialConsumptions.new}>
              <Plus className="mr-2 h-4 w-4" />
              Record Consumption
            </Link>
          </Button>
        }
      />

      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Records
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {consumptions.length}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <FlameKindling className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all time</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              This Month
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {thisMonth.length}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CalendarDays className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              current month
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Materials Used
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                {uniqueMaterials}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <Package className="size-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              distinct materials
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Quantity
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                {totalQty}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <BarChart3 className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              units consumed
            </p>
          </div>
        </div>
      </Card>

      <ConsumptionTable
        paginated={paginated}
        filteredCount={filtered.length}
        startIndex={startIndex}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(n) => {
          setItemsPerPage(n);
          setCurrentPage(1);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        hasActiveFilters={hasActiveFilters}
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        typeFilter={typeFilter}
        onTypeChange={(v) => {
          setTypeFilter(v as ConsumptionType | 'all');
          setCurrentPage(1);
        }}
        projectFilter={projectFilter}
        onProjectChange={(v) => {
          setProjectFilter(v);
          setCurrentPage(1);
        }}
        projectOptions={projectOptions}
      />
    </div>
  );
}
