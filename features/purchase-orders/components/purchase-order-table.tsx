'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pagination } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { ShoppingCart, Search } from 'lucide-react';
import { routes } from '@/nav';
import {
  PurchaseOrderStatus,
  purchaseOrderStatusLabels,
  type PurchaseOrder,
} from '@/types/purchase-orders';
import { PurchaseOrderRow } from './purchase-order-row';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

interface PurchaseOrderTableProps {
  paginated: PurchaseOrder[];
  filteredCount: number;
  startIndex: number;
  itemsPerPage: number;
  onItemsPerPageChange: (n: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  searchValue: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  projectFilter: string;
  onProjectChange: (v: string) => void;
  projectOptions: string[];
}

export function PurchaseOrderTable({
  paginated,
  filteredCount,
  startIndex,
  itemsPerPage,
  onItemsPerPageChange,
  currentPage,
  totalPages,
  onPageChange,
  hasActiveFilters,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusChange,
  projectFilter,
  onProjectChange,
  projectOptions,
}: PurchaseOrderTableProps) {
  const router = useRouter();
  const endIndex = Math.min(startIndex + itemsPerPage, filteredCount);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 border-b px-4 py-1">
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by PO number or vendor…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(PurchaseOrderStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {purchaseOrderStatusLabels[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={onProjectChange}>
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
            onValueChange={(v) => onItemsPerPageChange(Number(v))}
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
                  <TableHead className="pl-6">PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead className="pr-6">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((po) => (
                  <PurchaseOrderRow
                    key={po.id}
                    order={po}
                    onClick={() =>
                      router.push(
                        routes.resources.purchaseOrders.detail(po.id).href
                      )
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <div className="flex items-center justify-between border-t px-4 py-2">
            <span className="text-sm text-zinc-500">
              {startIndex + 1}–{endIndex} of {filteredCount} purchase order
              {filteredCount === 1 ? '' : 's'}
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </>
      ) : (
        <CardContent>
          <Empty variant="default">
            <EmptyMedia variant="icon">
              <ShoppingCart className="size-6" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No purchase orders found</EmptyTitle>
              <EmptyDescription>
                {hasActiveFilters
                  ? 'No purchase orders match your filters. Try adjusting your search.'
                  : 'Create your first purchase order to get started.'}
              </EmptyDescription>
            </EmptyHeader>
            {!hasActiveFilters && (
              <Button asChild>
                <Link href={routes.resources.purchaseOrders.new}>
                  Create PO
                </Link>
              </Button>
            )}
          </Empty>
        </CardContent>
      )}
    </Card>
  );
}
