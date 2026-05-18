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
  Receipt,
  CalendarDays,
  IndianRupee,
  ShoppingCart,
} from 'lucide-react';
import { useGRNs } from '@/hooks/grn';
import { GoodsReceiptTable } from '@/features/grn/components';

export default function GoodsReceiptsPage() {
  const { data: grns = [], isLoading } = useGRNs();

  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

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

      <GoodsReceiptTable
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
