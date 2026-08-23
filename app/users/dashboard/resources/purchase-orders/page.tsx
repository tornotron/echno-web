'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { routes } from '@/nav';
import { Card } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { PageHeader, ActiveFilterChip } from '@/components/common';
import {
  useEmployeeFilterFromParams,
  rowMatchesEmployeeFilter,
  ROLE_LABELS,
} from '@/hooks/use-employee-filter';
import {
  Plus,
  Loader2,
  ShoppingCart,
  FileText,
  CheckCircle2,
  Truck,
} from 'lucide-react';
import { usePurchaseOrders } from '@tornotron/echno-core/purchase-orders/hooks';
import { PurchaseOrderTable } from '@/features/purchase-orders/components';
import { PurchaseOrderStatus } from '@tornotron/echno-core/purchase-orders/types';

export default function PurchaseOrdersPage() {
  const { data: orders = [], isLoading } = usePurchaseOrders();

  const { employeeId, role, name, clear } = useEmployeeFilterFromParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return orders.filter((po) => {
      const matchesSearch =
        !searchQuery ||
        po.poNumber.toLowerCase().includes(q) ||
        po.vendorName.toLowerCase().includes(q) ||
        po.projectName?.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'all' || po.status === statusFilter;
      const matchesProject =
        projectFilter === 'all' || po.projectName === projectFilter;
      const matchesEmployee =
        employeeId == null ||
        role == null ||
        rowMatchesEmployeeFilter(po, employeeId, role, {
          creator: (p) => p.createdBy?.id,
        });
      return (
        matchesSearch && matchesStatus && matchesProject && matchesEmployee
      );
    });
  }, [orders, searchQuery, statusFilter, projectFilter, employeeId, role]);

  const projectOptions = useMemo(() => {
    const names = new Set<string>();
    for (const po of orders) {
      if (po.projectName) names.add(po.projectName);
    }
    return [...names].toSorted();
  }, [orders]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: orders.length,
    draft: orders.filter((po) => po.status === PurchaseOrderStatus.draft)
      .length,
    approved: orders.filter((po) => po.status === PurchaseOrderStatus.approved)
      .length,
    sentToVendor: orders.filter(
      (po) => po.status === PurchaseOrderStatus.sentToVendor
    ).length,
  };

  const hasActiveFilters =
    !!searchQuery || statusFilter !== 'all' || projectFilter !== 'all';

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
        title="Purchase Orders"
        description="Manage vendor purchase orders"
        actions={
          <Button asChild>
            <Link href={routes.resources.purchaseOrders.new}>
              <Plus className="mr-2 h-4 w-4" />
              Create PO
            </Link>
          </Button>
        }
      />

      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total POs
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {stats.total}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <ShoppingCart className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all time</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Draft</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {stats.draft}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <FileText className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              not submitted
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Approved</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {stats.approved}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              ready to dispatch
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Sent to Vendor
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                {stats.sentToVendor}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <Truck className="size-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              awaiting delivery
            </p>
          </div>
        </div>
      </Card>

      {employeeId != null && name && (
        <ActiveFilterChip
          label={ROLE_LABELS[role ?? ''] ?? 'Filtered by'}
          name={name}
          onDismiss={clear}
        />
      )}

      <PurchaseOrderTable
        paginated={paginated}
        filteredCount={filtered.length}
        startIndex={startIndex}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(n) => {
          setItemsPerPage(n);
          setCurrentPage(1);
        }}
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        hasActiveFilters={hasActiveFilters}
        searchValue={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(v) => {
          setStatusFilter(v);
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
