'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
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
  Receipt,
  CalendarDays,
  IndianRupee,
  ShoppingCart,
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
import { useGRNs } from '@/hooks/grn';
import { GoodsReceiptRow } from '@/features/resources/components';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

export default function GoodsReceiptsPage() {
  const router = useRouter();
  const { data: grns = [], isLoading } = useGRNs();

  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [prevFilters, setPrevFilters] = useState({
    searchQuery,
    projectFilter,
    itemsPerPage,
  });

  if (
    prevFilters.searchQuery !== searchQuery ||
    prevFilters.projectFilter !== projectFilter ||
    prevFilters.itemsPerPage !== itemsPerPage
  ) {
    setPrevFilters({ searchQuery, projectFilter, itemsPerPage });
    setCurrentPage(1);
  }

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return grns.filter(
      (grn) =>
        (!searchQuery ||
          grn.grnNumber.toLowerCase().includes(q) ||
          grn.vendorName.toLowerCase().includes(q) ||
          grn.purchaseOrderNumber?.toLowerCase().includes(q) ||
          grn.projectName?.toLowerCase().includes(q)) &&
        (projectFilter === 'all' || grn.projectName === projectFilter)
    );
  }, [grns, searchQuery, projectFilter]);

  const projectOptions = useMemo(() => {
    const names = new Set<string>();
    for (const g of grns) {
      if (g.projectName) names.add(g.projectName);
    }
    return [...names].toSorted();
  }, [grns]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);
  const paginated = filtered.slice(startIndex, endIndex);

  const now = new Date();
  const thisMonth = grns.filter((g) => {
    const d = new Date(g.receivedOn);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const totalInvoice = grns.reduce((sum, g) => sum + (g.invoiceAmount ?? 0), 0);
  const withPO = grns.filter((g) => !!g.purchaseOrderId).length;

  const hasActiveFilters = !!searchQuery || projectFilter !== 'all';

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
        title="Goods Receipts"
        description="Manage goods received notes"
        actions={
          <Button asChild>
            <Link href={routes.resources.goodsReceipts.new}>
              <Plus className="mr-2 h-4 w-4" />
              Record GRN
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total GRNs
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {grns.length}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <Receipt className="size-4 text-blue-600 dark:text-blue-400" />
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
              Linked to PO
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                {withPO}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <ShoppingCart className="size-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              have a purchase order
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Invoice Value
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                {totalInvoice > 0
                  ? `₹${totalInvoice.toLocaleString('en-IN')}`
                  : '—'}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30">
                <IndianRupee className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              total billed
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
              placeholder="Search by GRN number, vendor, PO or project…"
              className="h-8 pl-8 text-sm"
            />
          </div>
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
                    <TableHead className="pl-6">GRN Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Received On</TableHead>
                    <TableHead>Purchase Order</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="pr-6">Invoice Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((grn) => (
                    <GoodsReceiptRow
                      key={grn.id}
                      grn={grn}
                      onClick={() =>
                        router.push(
                          routes.resources.goodsReceipts.detail(grn.id).href
                        )
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <div className="flex items-center justify-between border-t px-4 py-2">
              <span className="text-sm text-zinc-500">
                {startIndex + 1}–{endIndex} of {filtered.length} GRN
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
                <Receipt className="size-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No goods receipts found</EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilters
                    ? 'No GRNs match your search. Try adjusting your filters.'
                    : 'Record your first GRN to get started.'}
                </EmptyDescription>
              </EmptyHeader>
              {!hasActiveFilters && (
                <Button asChild>
                  <Link href={routes.resources.goodsReceipts.new}>
                    Record GRN
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
