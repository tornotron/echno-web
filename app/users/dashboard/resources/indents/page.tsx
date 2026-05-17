'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Card, CardContent } from '@/components/shadcn/card';
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
  ClipboardList,
  Clock,
  TruckIcon,
  Package,
  FolderOpen,
} from 'lucide-react';
import {
  Empty,
  EmptyMedia,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { format } from 'date-fns';
import { useIndentsPaginated } from '@/hooks/indents';
import {
  IndentStatus,
  indentStatusLabels,
  indentStatusBadgeColors,
} from '@/types/indents';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

export default function IndentsPage() {
  const router = useRouter();
  const {
    data: indents = [],
    isLoading,
    isError,
  } = useIndentsPaginated(0, 200);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [prevFilters, setPrevFilters] = useState({
    searchQuery,
    statusFilter,
    itemsPerPage,
  });

  if (
    prevFilters.searchQuery !== searchQuery ||
    prevFilters.statusFilter !== statusFilter ||
    prevFilters.itemsPerPage !== itemsPerPage
  ) {
    setPrevFilters({ searchQuery, statusFilter, itemsPerPage });
    setCurrentPage(1);
  }

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return indents.filter((i) => {
      const matchesSearch =
        !searchQuery ||
        i.indentNumber.toLowerCase().includes(q) ||
        i.projectName?.toLowerCase().includes(q) ||
        i.createdBy.name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [indents, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginated = filtered.slice(startIndex, endIndex);

  const stats = {
    total: indents.length,
    pending: indents.filter((i) => i.status === IndentStatus.pending).length,
    ordered: indents.filter((i) => i.status === IndentStatus.ordered).length,
    onSite: indents.filter((i) => i.status === IndentStatus.onSite).length,
  };

  const hasActiveFilters = !!searchQuery || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <ClipboardList className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Failed to load indents</EmptyTitle>
          <EmptyDescription>
            An unexpected error occurred. Please try again.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Indents"
        description="Manage material indent requests"
        actions={
          <Button asChild>
            <Link href={routes.resources.indents.new}>
              <Plus className="mr-2 h-4 w-4" />
              New Indent
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Indents
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {stats.total}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <ClipboardList className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all time</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Pending</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-yellow-600 dark:text-yellow-400">
                {stats.pending}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              awaiting action
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Ordered</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                {stats.ordered}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <Package className="size-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              PO raised
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">On Site</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {stats.onSite}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <TruckIcon className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              delivered
            </p>
          </div>
        </div>
      </Card>

      {/* Search & Filter */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by indent number, project or creator..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Status',
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            },
            options: [
              { value: 'all', label: 'All Statuses' },
              ...Object.values(IndentStatus).map((s) => ({
                value: s,
                label: indentStatusLabels[s],
              })),
            ],
          },
        ]}
      />

      {/* Results summary + rows per page */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {filtered.length === 0
            ? 'No indents found'
            : `Showing ${startIndex + 1} to ${Math.min(endIndex, filtered.length)} of ${filtered.length} indent${filtered.length === 1 ? '' : 's'}`}
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
                  <TableHead className="pl-6">Indent #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Expected On</TableHead>
                  <TableHead className="pr-6">Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((indent) => {
                  const convertedCount = indent.items.filter(
                    (it) => it.convertedToPurchaseOrder
                  ).length;
                  return (
                    <TableRow
                      key={indent.id}
                      role="link"
                      tabIndex={0}
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      onClick={() =>
                        router.push(
                          routes.resources.indents.detail(indent.id).href
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          router.push(
                            routes.resources.indents.detail(indent.id).href
                          );
                        }
                      }}
                    >
                      <TableCell className="pl-6 font-medium">
                        {indent.indentNumber}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={indentStatusBadgeColors[indent.status]}
                        >
                          {indentStatusLabels[indent.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {indent.projectName ? (
                          <span className="flex items-center gap-1.5 text-sm">
                            <FolderOpen className="h-3.5 w-3.5 text-zinc-400" />
                            {indent.projectName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {indent.items.length}
                          {convertedCount > 0 && (
                            <span className="text-muted-foreground ml-1">
                              ({convertedCount} converted)
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {indent.expectedOn
                          ? format(new Date(indent.expectedOn), 'MMM dd, yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground pr-6 text-sm">
                        {indent.createdBy.name}
                      </TableCell>
                    </TableRow>
                  );
                })}
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
        <Empty variant="default">
          <EmptyMedia variant="icon">
            <ClipboardList className="size-6" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No indents found</EmptyTitle>
            <EmptyDescription>
              {hasActiveFilters
                ? 'No indents match your filters. Try adjusting your search.'
                : 'Create your first indent to get started.'}
            </EmptyDescription>
          </EmptyHeader>
          {!hasActiveFilters && (
            <Button asChild>
              <Link href={routes.resources.indents.new}>New Indent</Link>
            </Button>
          )}
        </Empty>
      )}
    </div>
  );
}
