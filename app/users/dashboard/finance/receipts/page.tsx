'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { mockReceipts, mockProjects } from '@/components/shared/mock-data';
import { Pagination, SearchAndFilter, PageHeader } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/shadcn/card';
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
} from 'lucide-react';
import {
  Empty,
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
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <ReceiptIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {totalReceipts}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Issued</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {issuedReceipts}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Drafts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <FileText className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {draftReceipts}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Amount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                ₹{(totalAmount / 1_000_000).toFixed(1)}M
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <SearchAndFilter
        variant="card"
        searchValue={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search by receipt number, customer, transaction..."
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        filters={[
          {
            placeholder: 'Status',
            options: [
              { value: 'all', label: 'All Statuses' },
              {
                value: ReceiptStatus.issued,
                label: receiptStatusLabels[ReceiptStatus.issued],
              },
              {
                value: ReceiptStatus.draft,
                label: receiptStatusLabels[ReceiptStatus.draft],
              },
              {
                value: ReceiptStatus.cancelled,
                label: receiptStatusLabels[ReceiptStatus.cancelled],
              },
            ],
            value: statusFilter,
            onChange: (value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            },
          },
          {
            placeholder: 'Type',
            options: [
              { value: 'all', label: 'All Types' },
              {
                value: ReceiptType.payment,
                label: receiptTypeLabels[ReceiptType.payment],
              },
              {
                value: ReceiptType.advance,
                label: receiptTypeLabels[ReceiptType.advance],
              },
              {
                value: ReceiptType.deposit,
                label: receiptTypeLabels[ReceiptType.deposit],
              },
              {
                value: ReceiptType.refund,
                label: receiptTypeLabels[ReceiptType.refund],
              },
              {
                value: ReceiptType.other,
                label: receiptTypeLabels[ReceiptType.other],
              },
            ],
            value: typeFilter,
            onChange: (value) => {
              setTypeFilter(value);
              setCurrentPage(1);
            },
          },
        ]}
      />

      {/* Results Summary */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {startIndex + 1} to{' '}
          {Math.min(endIndex, filteredReceipts.length)} of{' '}
          {filteredReceipts.length} receipts
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Rows per page:
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Receipts Table */}
      {filteredReceipts.length > 0 ? (
        <Card>
          <CardContent className="p-0">
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
                          {projectById.get(receipt.projectId)?.projectName ||
                            'Unknown Project'}
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
          </CardContent>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Card>
      ) : (
        <Card>
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
        </Card>
      )}
    </div>
  );
}
