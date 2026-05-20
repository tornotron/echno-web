'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { mockReceipts, mockProjects } from '@/components/shared/mock-data';
import { Pagination, PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Input } from '@/components/shadcn/input';
import {
  Table,
  TableBody,
  TableCell,
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
import {
  Receipt as ReceiptIcon,
  DollarSign,
  Calendar,
  FileText,
  Search,
  Loader2,
} from 'lucide-react';
import {
  Empty,
  EmptyErrorMedia,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import Link from 'next/link';
import { routes } from '@/nav';
import { format } from 'date-fns';
import {
  ReceiptType,
  ReceiptStatus,
  receiptTypeLabels,
  receiptStatusLabels,
} from '@/types/finance/receipt';

const getStatusColor = (status: ReceiptStatus) => {
  switch (status) {
    case ReceiptStatus.issued: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case ReceiptStatus.draft: {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    case ReceiptStatus.cancelled: {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

const getTypeColor = (type: ReceiptType) => {
  switch (type) {
    case ReceiptType.payment: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case ReceiptType.advance: {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    }
    case ReceiptType.deposit: {
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
    }
    case ReceiptType.refund: {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

export default function ReceiptsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Memoized project lookup map for O(1) access
  const projectById = useMemo(() => {
    const m = new Map();
    for (const p of mockProjects) m.set(p.id, p);
    return m;
  }, []);

  // Filter receipts based on search and filters
  const filteredReceipts = useMemo(() => {
    return mockReceipts.filter((receipt) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        receipt.receiptNumber.toLowerCase().includes(searchLower) ||
        receipt.receivedFrom.toLowerCase().includes(searchLower) ||
        receipt.transactionId?.toLowerCase().includes(searchLower) ||
        receipt.referenceNumber?.toLowerCase().includes(searchLower) ||
        receipt.description?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus =
        statusFilter === 'all' || receipt.status === statusFilter;

      // Type filter
      const matchesType = typeFilter === 'all' || receipt.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [searchQuery, statusFilter, typeFilter]);

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReceipts = filteredReceipts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));

  // Calculate stats
  const totalReceipts = mockReceipts.length;
  const issuedReceipts = mockReceipts.filter(
    (r) => r.status === ReceiptStatus.issued
  ).length;
  const draftReceipts = mockReceipts.filter(
    (r) => r.status === ReceiptStatus.draft
  ).length;
  const totalAmount = mockReceipts
    .filter((r) => r.status === ReceiptStatus.issued)
    .reduce((sum, r) => sum + r.amount, 0);

  // Selection handlers
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
    selectedIds.length === paginatedReceipts.length;

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Receipts"
        description="Track and manage all financial receipts"
        actions={
          <Button asChild>
            <Link href={routes.finance.receipts.new}>New Receipt</Link>
          </Button>
        }
      />

      {/* Statistics Cards */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Receipts
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {totalReceipts}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <ReceiptIcon className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all time</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Issued</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {issuedReceipts}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <FileText className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              active receipts
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Drafts</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-yellow-600 dark:text-yellow-400">
                {draftReceipts}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <FileText className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              pending issue
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pl-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Amount
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                ₹{(totalAmount / 1_000_000).toFixed(1)}M
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <DollarSign className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              issued receipts
            </p>
          </div>
        </div>
      </Card>

      {/* Unified Card: search/filter toolbar + content + pagination */}
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
          {/* Rows per page — pushed to right */}
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
            const isLoading = false;
            const isError = false;
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
                    {paginatedReceipts.map((receipt) => {
                      return (
                        <TableRow
                          key={receipt.id}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() =>
                            router.push(
                              routes.finance.receipts.detail(receipt.id).href
                            )
                          }
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.includes(receipt.id)}
                              onCheckedChange={(checked) =>
                                handleSelectOne(receipt.id, checked as boolean)
                              }
                              aria-label={`Select ${receipt.receiptNumber}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-green-500 to-green-600">
                                <ReceiptIcon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                  {receipt.receiptNumber}
                                </p>
                                {receipt.transactionId && (
                                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                    TXN: {receipt.transactionId}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(receipt.type)}>
                              {receiptTypeLabels[receipt.type]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {projectById.get(receipt.projectId)
                                ?.projectName || 'Unknown Project'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-zinc-700 dark:text-zinc-300">
                                {receipt.receivedFrom}
                              </p>
                              {receipt.referenceNumber && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                  Ref: {receipt.referenceNumber}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              ₹{receipt.amount.toLocaleString('en-IN')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                              <Calendar className="h-3 w-3 text-zinc-400" />
                              <span>
                                {format(receipt.receiptDate, 'dd MMM yyyy')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {receipt.paymentMethod}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(receipt.status)}>
                              {receiptStatusLabels[receipt.status]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
                      <Link href={routes.finance.receipts.new}>
                        New Receipt
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
    </div>
  );
}
