'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
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
import { SearchAndFilter, Pagination, PageHeader } from '@/components/common';
import {
  Plus,
  Loader2,
  FlameKindling,
  CalendarDays,
  Package,
  BarChart3,
} from 'lucide-react';
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
      return matchesSearch && matchesType;
    });
  }, [consumptions, searchQuery, typeFilter]);

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

  const hasActiveFilters = !!searchQuery || typeFilter !== 'all';
  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCurrentPage(1);
  };

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
            <Link href="/users/dashboard/resources/material-consumptions/new">
              <Plus className="mr-2 h-4 w-4" />
              Record Consumption
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(
          [
            {
              label: 'Total Records',
              count: consumptions.length,
              color: 'blue',
              icon: FlameKindling,
            },
            {
              label: 'This Month',
              count: thisMonth.length,
              color: 'green',
              icon: CalendarDays,
            },
            {
              label: 'Materials Used',
              count: uniqueMaterials,
              color: 'purple',
              icon: Package,
            },
            {
              label: 'Total Quantity',
              count: totalQty,
              color: 'orange',
              icon: BarChart3,
            },
          ] as const
        ).map(({ label, count, color, icon: Icon }) => {
          const colorClasses = {
            blue: {
              bg: 'bg-blue-100 dark:bg-blue-900/20',
              text: 'text-blue-600 dark:text-blue-400',
            },
            green: {
              bg: 'bg-green-100 dark:bg-green-900/20',
              text: 'text-green-600 dark:text-green-400',
            },
            purple: {
              bg: 'bg-purple-100 dark:bg-purple-900/20',
              text: 'text-purple-600 dark:text-purple-400',
            },
            orange: {
              bg: 'bg-orange-100 dark:bg-orange-900/20',
              text: 'text-orange-600 dark:text-orange-400',
            },
          } satisfies Record<string, { bg: string; text: string }>;
          const classes = colorClasses[color];
          return (
            <Card key={label}>
              <CardHeader className="pb-3">
                <CardDescription>{label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${classes.bg}`}
                  >
                    <Icon className={`h-6 w-6 ${classes.text}`} />
                  </div>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {count}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search & Filter */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by material, project, task or person..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            value: typeFilter,
            options: [
              { label: 'All Types', value: 'all' },
              ...Object.values(ConsumptionType).map((t) => ({
                label: consumptionTypeLabels[t],
                value: t,
              })),
            ],
            onChange: (v) => {
              setTypeFilter(v as ConsumptionType | 'all');
              setCurrentPage(1);
            },
          },
        ]}
      />

      {/* Results summary + rows per page */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {filtered.length === 0
            ? 'No consumptions found'
            : `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, filtered.length)} of ${filtered.length} record${filtered.length === 1 ? '' : 's'}`}
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Rows per page:
          </span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(v) => {
              setItemsPerPage(Number(v));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[70px]">
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
      </div>

      {/* Table or empty state */}
      {paginated.length > 0 ? (
        <Card>
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
                        `/users/dashboard/resources/material-consumptions/${c.id}`
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FlameKindling className="mx-auto mb-4 h-12 w-12 text-zinc-400" />
            <h3 className="mb-2 text-lg font-medium">No consumptions found</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {hasActiveFilters
                ? 'No records match your search. Try adjusting your filters.'
                : 'Record your first material consumption to get started.'}
            </p>
            {!hasActiveFilters && (
              <Button asChild>
                <Link href="/users/dashboard/resources/material-consumptions/new">
                  Record Consumption
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
