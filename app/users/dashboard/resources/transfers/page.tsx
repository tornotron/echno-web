'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
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
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import {
  Plus,
  Loader2,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Package,
} from 'lucide-react';
import { format } from 'date-fns';
import { useSiteTransfers } from '@/hooks/site-transfers';
import {
  SiteTransferStatus,
  siteTransferStatusLabels,
  siteTransferStatusBadgeColors,
} from '@/types/site-transfers';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

export default function SiteTransfersPage() {
  const router = useRouter();
  const { data: transfers = [], isLoading } = useSiteTransfers();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SiteTransferStatus | 'all'>(
    'all'
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return transfers.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.transferNumber.toLowerCase().includes(q) ||
        t.sendingPerson.name.toLowerCase().includes(q) ||
        t.receivingProjectName?.toLowerCase().includes(q) ||
        t.sendingProjectName?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transfers, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const pending = transfers.filter(
    (t) => t.status === SiteTransferStatus.pending
  ).length;
  const completed = transfers.filter(
    (t) => t.status === SiteTransferStatus.completed
  ).length;
  const totalItems = transfers.reduce((sum, t) => sum + t.items.length, 0);

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

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Site Transfers"
        description="Material transfers between sites and projects"
        actions={
          <Button asChild>
            <Link href={routes.resources.transfers.new}>
              <Plus className="mr-2 h-4 w-4" />
              New Transfer
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {(
          [
            {
              label: 'Total Transfers',
              count: transfers.length,
              color: 'blue',
              icon: ArrowRightLeft,
            },
            { label: 'Pending', count: pending, color: 'yellow', icon: Clock },
            {
              label: 'Completed',
              count: completed,
              color: 'green',
              icon: CheckCircle2,
            },
            {
              label: 'Total Items Moved',
              count: totalItems,
              color: 'orange',
              icon: Package,
            },
          ] as const
        ).map(({ label, count, color, icon: Icon }) => {
          const colorClasses = {
            blue: {
              bg: 'bg-blue-100 dark:bg-blue-900/20',
              text: 'text-blue-600 dark:text-blue-400',
            },
            yellow: {
              bg: 'bg-yellow-100 dark:bg-yellow-900/20',
              text: 'text-yellow-600 dark:text-yellow-400',
            },
            green: {
              bg: 'bg-green-100 dark:bg-green-900/20',
              text: 'text-green-600 dark:text-green-400',
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
        searchPlaceholder="Search by transfer number, project or person..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            value: statusFilter,
            options: [
              { label: 'All Statuses', value: 'all' },
              ...Object.values(SiteTransferStatus).map((s) => ({
                label: siteTransferStatusLabels[s],
                value: s,
              })),
            ],
            onChange: (v) => {
              setStatusFilter(v as SiteTransferStatus | 'all');
              setCurrentPage(1);
            },
          },
        ]}
      />

      {/* Results summary + rows per page */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {filtered.length === 0
            ? 'No transfers found'
            : `Showing ${startIndex + 1} to ${Math.min(startIndex + itemsPerPage, filtered.length)} of ${filtered.length} transfer${filtered.length === 1 ? '' : 's'}`}
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
                  <TableHead className="pl-6">Transfer #</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Sending Person</TableHead>
                  <TableHead>From Project</TableHead>
                  <TableHead>To Project</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    onClick={() =>
                      router.push(routes.resources.transfers.detail(t.id).href)
                    }
                  >
                    <TableCell className="pl-6 font-medium">
                      {t.transferNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(t.issueDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {t.sendingPerson.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {t.sendingProjectName ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {t.receivingProjectName ?? '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {t.items.length}
                    </TableCell>
                    <TableCell className="pr-6">
                      <Badge
                        className={siteTransferStatusBadgeColors[t.status]}
                      >
                        {siteTransferStatusLabels[t.status]}
                      </Badge>
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
        <Empty variant="default">
          <EmptyMedia variant="icon">
            <ArrowRightLeft className="size-6" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No transfers found</EmptyTitle>
            <EmptyDescription>
              {hasActiveFilters
                ? 'No transfers match your search. Try adjusting your filters.'
                : 'Create your first site transfer to get started.'}
            </EmptyDescription>
          </EmptyHeader>
          {!hasActiveFilters && (
            <Button asChild>
              <Link href={routes.resources.transfers.new}>New Transfer</Link>
            </Button>
          )}
        </Empty>
      )}
    </div>
  );
}
