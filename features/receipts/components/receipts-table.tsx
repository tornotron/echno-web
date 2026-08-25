'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/nav';
import { Pagination } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Receipt as ReceiptIcon, Search, Loader2 } from 'lucide-react';
import {
  Empty,
  EmptyErrorMedia,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import Link from 'next/link';
import {
  Receipt,
  ReceiptType,
  ReceiptStatus,
  receiptTypeLabels,
  receiptStatusLabels,
} from '@/types/finance/receipt';
import { ReceiptRow } from './receipt-row';

export interface ReceiptsTableProps {
  receipts: Receipt[];
  isLoading: boolean;
  isError: boolean;
  projectById: Map<number, { projectName: string }>;
}

export function ReceiptsTable({
  receipts,
  isLoading,
  isError,
  projectById,
}: ReceiptsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((receipt) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        receipt.receiptNumber.toLowerCase().includes(searchLower) ||
        receipt.receivedFrom.toLowerCase().includes(searchLower) ||
        receipt.transactionId?.toLowerCase().includes(searchLower) ||
        receipt.referenceNumber?.toLowerCase().includes(searchLower) ||
        receipt.description?.toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === 'all' || receipt.status === statusFilter;

      const matchesType = typeFilter === 'all' || receipt.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [receipts, searchQuery, statusFilter, typeFilter]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReceipts = filteredReceipts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedReceipts.map((r) => r.id));
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
    paginatedReceipts.length > 0 &&
    paginatedReceipts.every((r) => selectedIds.includes(r.id));

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
  );

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-3 border-b px-4 py-1">
        {/* Search input */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by receipt number, customer, transaction..."
            className="h-8 pl-8 text-sm"
          />
        </div>
        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value={ReceiptStatus.issued}>
              {receiptStatusLabels[ReceiptStatus.issued]}
            </SelectItem>
            <SelectItem value={ReceiptStatus.draft}>
              {receiptStatusLabels[ReceiptStatus.draft]}
            </SelectItem>
            <SelectItem value={ReceiptStatus.cancelled}>
              {receiptStatusLabels[ReceiptStatus.cancelled]}
            </SelectItem>
          </SelectContent>
        </Select>
        {/* Type filter */}
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value={ReceiptType.payment}>
              {receiptTypeLabels[ReceiptType.payment]}
            </SelectItem>
            <SelectItem value={ReceiptType.advance}>
              {receiptTypeLabels[ReceiptType.advance]}
            </SelectItem>
            <SelectItem value={ReceiptType.deposit}>
              {receiptTypeLabels[ReceiptType.deposit]}
            </SelectItem>
            <SelectItem value={ReceiptType.refund}>
              {receiptTypeLabels[ReceiptType.refund]}
            </SelectItem>
            <SelectItem value={ReceiptType.other}>
              {receiptTypeLabels[ReceiptType.other]}
            </SelectItem>
          </SelectContent>
        </Select>
        {/* Rows per page */}
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
                    <ReceiptIcon className="size-6" />
                  </EmptyErrorMedia>
                  <EmptyHeader>
                    <EmptyTitle>Failed to load receipts</EmptyTitle>
                    <EmptyDescription>
                      An unexpected error occurred. Please try again.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            );
          if (paginatedReceipts.length > 0)
            return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Receipt Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Received From</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReceipts.map((receipt) => (
                    <ReceiptRow
                      key={receipt.id}
                      receipt={receipt}
                      isSelected={selectedIds.includes(receipt.id)}
                      onSelect={(checked) =>
                        handleSelectOne(receipt.id, checked)
                      }
                      projectName={
                        projectById.get(receipt.projectId)?.projectName ||
                        'Unknown Project'
                      }
                      onClick={() =>
                        router.push(
                          routes.finance.receipts.detail(receipt.id).href
                        )
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            );
          return (
            <CardContent>
              <Empty variant="default">
                <EmptyMedia variant="icon">
                  <ReceiptIcon className="size-6" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>No receipts found</EmptyTitle>
                  <EmptyDescription>
                    {hasActiveFilters
                      ? 'Try adjusting your search or filters.'
                      : 'Add your first receipt to get started.'}
                  </EmptyDescription>
                </EmptyHeader>
                {!hasActiveFilters && (
                  <Button asChild>
                    <Link href={routes.finance.receipts.new}>New Receipt</Link>
                  </Button>
                )}
              </Empty>
            </CardContent>
          );
        })()}
      </CardContent>

      <div className="flex items-center justify-between border-t px-4 py-2">
        <span className="text-sm text-zinc-500">
          {filteredReceipts.length === 0
            ? '0 records'
            : `${startIndex + 1}–${Math.min(endIndex, filteredReceipts.length)} of ${filteredReceipts.length} ${filteredReceipts.length === 1 ? 'receipt' : 'receipts'}`}
        </span>
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </Card>
  );
}
