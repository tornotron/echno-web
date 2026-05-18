'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Input } from '@/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { Pagination, PageHeader } from '@/components/common';
import {
  Plus,
  Loader2,
  FlameKindling,
  CalendarDays,
  Package,
  BarChart3,
  Search,
} from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { format } from 'date-fns';
import { useAllMaterialConsumptions } from '@/hooks/materials';
import { ConsumptionType, consumptionTypeLabels } from '@/types/materials';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

const consumptionTypeBadgeColors: Record<ConsumptionType, string> = {
  [ConsumptionType.usedFromStock]:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  [ConsumptionType.transferred]:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
};

export default function MaterialConsumptionsPage() {
  const router = useRouter();
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
  const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
  const paginated = filtered.slice(startIndex, endIndex);

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

      {/* Stats */}
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

      {/* Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-1">
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by material, project, task or person…"
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v as ConsumptionType | 'all');
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.values(ConsumptionType).map((t) => (
                <SelectItem key={t} value={t}>
                  {consumptionTypeLabels[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={projectFilter}
            onValueChange={(v) => {
              setProjectFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projectOptions.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-2 border-l pl-3">
            <span className="text-xs whitespace-nowrap text-zinc-500">
              Rows per page
            </span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(v) => {
                setItemsPerPage(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {paginated.length > 0 ? (
          <>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Date</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead className="pr-6">Recorded By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      onClick={() =>
                        router.push(
                          routes.resources.materialConsumptions.detail(c.id)
                            .href
                        )
                      }
                    >
                      <TableCell className="text-muted-foreground pl-6 text-sm">
                        {format(new Date(c.consumptionDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {c.materialName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            consumptionTypeBadgeColors[c.consumptionType]
                          }
                        >
                          {consumptionTypeLabels[c.consumptionType]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.quantity}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.projectName ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.taskTitle ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground pr-6 text-sm">
                        {c.createdBy.name}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <div className="flex items-center justify-between border-t px-4 py-2">
              <span className="text-sm text-zinc-500">
                {startIndex + 1}–{endIndex} of {filtered.length} record
                {filtered.length === 1 ? '' : 's'}
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <CardContent>
            <Empty variant="default">
              <EmptyMedia variant="icon">
                <FlameKindling className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No consumptions found</EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilters
                    ? 'No records match your search. Try adjusting your filters.'
                    : 'Record your first material consumption to get started.'}
                </EmptyDescription>
              </EmptyHeader>
              {!hasActiveFilters && (
                <Button asChild>
                  <Link href={routes.resources.materialConsumptions.new}>
                    Record Consumption
                  </Link>
                </Button>
              )}
            </Empty>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
