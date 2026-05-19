'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pagination, PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
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
import {
  HardHat,
  Loader2,
  Plus,
  User,
  Download,
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  Search,
} from 'lucide-react';

import Link from 'next/link';
import { routes } from '@/nav';
import { useLabour } from '@/hooks/labour';
import { PhoneDisplay } from '@/components/shadcn/phone-input';
import {
  Empty,
  EmptyErrorMedia,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';

const typeLabels = {
  daily: 'Daily Wage',
  monthly: 'Monthly',
  contract: 'Contract',
  piece: 'Piece Rate',
};

const statusColors = {
  active: 'green',
  inactive: 'zinc',
  onLeave: 'orange',
  terminated: 'red',
};

const statusLabels = {
  active: 'Active',
  inactive: 'Inactive',
  onLeave: 'On Leave',
  terminated: 'Terminated',
};

const skillLevelLabels = {
  unskilled: 'Unskilled',
  semiskilled: 'Semi-Skilled',
  skilled: 'Skilled',
  highlySkilled: 'Highly Skilled',
};

export default function LabourPage() {
  const router = useRouter();
  const { data: labour = [], isLoading, isError } = useLabour();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const hasActiveFilters = Boolean(
    statusFilter !== 'all' ||
      typeFilter !== 'all' ||
      projectFilter !== 'all' ||
      searchQuery !== ''
  );

  // Get unique projects for filter
  const uniqueProjects = [
    ...new Set(
      labour
        .map((l) => l.currentProject)
        .filter((p): p is string => p !== undefined && p !== null)
    ),
  ].toSorted();

  // Filter data
  const filteredLabour = labour.filter((labour) => {
    const matchesSearch =
      labour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      labour.labourId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      labour.trade.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || labour.status === statusFilter;
    const matchesType = typeFilter === 'all' || labour.type === typeFilter;
    const matchesProject =
      projectFilter === 'all' || labour.currentProject === projectFilter;
    return matchesSearch && matchesStatus && matchesType && matchesProject;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLabour.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLabour = filteredLabour.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedLabour.map((l) => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const isAllSelected =
    paginatedLabour.length > 0 && selectedIds.length === paginatedLabour.length;
  const isSomeSelected =
    selectedIds.length > 0 && selectedIds.length < paginatedLabour.length;

  // Statistics
  const stats = {
    total: labour.length,
    active: labour.filter((l) => l.status === 'active').length,
    totalDue: labour.reduce((sum, l) => sum + (l.totalDue ?? 0), 0),
    onLeave: labour.filter((l) => l.status === 'onLeave').length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Labour Management"
        description="Manage daily wage workers and contract labour"
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button size="sm" asChild>
              <Link href={routes.thirdParty.labour.new}>
                <Plus className="mr-2 h-4 w-4" />
                Add Labour
              </Link>
            </Button>
          </>
        }
      />

      {/* Statistics */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Labour
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight">{stats.total}</p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/30">
                <Users className="size-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Registered workers
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Active Workers
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight">
                {stats.active}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <UserCheck className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Currently working
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Outstanding
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight">
                ₹{stats.totalDue.toLocaleString()}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <DollarSign className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Pending payments
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">On Leave</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight">
                {stats.onLeave}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <TrendingUp className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Currently absent
            </p>
          </div>
        </div>
      </Card>

      {/* Labour Table */}
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
              placeholder="Search by name, ID, or trade..."
              className="h-8 pl-8 text-sm"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="onLeave">On Leave</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="daily">Daily Wage</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="piece">Piece Rate</SelectItem>
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
              {uniqueProjects.map((project) => (
                <SelectItem key={project} value={project}>
                  {project}
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
                {[5, 10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {(() => {
            if (isLoading)
              return (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                </div>
              );
            if (isError)
              return (
                <CardContent>
                  <Empty variant="default">
                    <EmptyErrorMedia>
                      <HardHat className="size-6" />
                    </EmptyErrorMedia>
                    <EmptyHeader>
                      <EmptyTitle>Failed to load labour records</EmptyTitle>
                      <EmptyDescription>
                        An unexpected error occurred. Please try again.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </CardContent>
              );
            if (paginatedLabour.length > 0)
              return (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                          className={
                            isSomeSelected
                              ? 'data-[state=checked]:bg-primary/50'
                              : ''
                          }
                        />
                      </TableHead>
                      <TableHead>Name & Contact</TableHead>
                      <TableHead>Trade</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Outstanding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLabour.map((labour) => (
                      <TableRow
                        key={labour.id}
                        className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        onClick={() =>
                          router.push(
                            routes.thirdParty.labour.detail(labour.id).href
                          )
                        }
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(labour.id)}
                            onCheckedChange={(checked) =>
                              handleSelectOne(labour.id, checked as boolean)
                            }
                            aria-label={`Select ${labour.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-orange-500 to-orange-600">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {labour.name}
                              </p>
                              <PhoneDisplay
                                value={labour.phone}
                                className="text-zinc-500 dark:text-zinc-500"
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{labour.trade}</div>
                            <div className="text-xs text-zinc-500">
                              {
                                skillLevelLabels[
                                  labour.skillLevel as keyof typeof skillLevelLabels
                                ]
                              }
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {typeLabels[labour.type as keyof typeof typeLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {labour.dailyRate && `₹${labour.dailyRate}/day`}
                          {labour.monthlyRate &&
                            `₹${labour.monthlyRate.toLocaleString()}/mo`}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{labour.currentProject}</div>
                          {labour.contractorName && (
                            <div className="text-xs text-zinc-500">
                              {labour.contractorName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`bg-${statusColors[labour.status as keyof typeof statusColors]}-100 text-${statusColors[labour.status as keyof typeof statusColors]}-700 dark:bg-${statusColors[labour.status as keyof typeof statusColors]}-900 dark:text-${statusColors[labour.status as keyof typeof statusColors]}-300`}
                          >
                            {
                              statusLabels[
                                labour.status as keyof typeof statusLabels
                              ]
                            }
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {labour.totalDue && labour.totalDue > 0 ? (
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              ₹{labour.totalDue.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-zinc-500">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              );
            return (
              <CardContent>
                <Empty variant="default">
                  <EmptyMedia variant="icon">
                    <HardHat className="size-6" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>No labour records found</EmptyTitle>
                    <EmptyDescription>
                      {hasActiveFilters
                        ? 'Try adjusting your search or filters.'
                        : 'Add your first labour record to get started.'}
                    </EmptyDescription>
                  </EmptyHeader>
                  {!hasActiveFilters && (
                    <Button asChild>
                      <Link href={routes.thirdParty.labour.new}>
                        Add Labour
                      </Link>
                    </Button>
                  )}
                </Empty>
              </CardContent>
            );
          })()}
        </CardContent>
        <div className="flex items-center justify-between border-t px-4 py-2">
          <span className="text-sm text-zinc-500">
            {filteredLabour.length === 0
              ? '0 records'
              : `${startIndex + 1}–${Math.min(startIndex + itemsPerPage, filteredLabour.length)} of ${filteredLabour.length} record${filteredLabour.length === 1 ? '' : 's'}`}
          </span>
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </Card>
    </div>
  );
}
