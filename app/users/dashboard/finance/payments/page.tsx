'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  mockPayments,
  mockProjects,
  mockEmployees,
  mockSubContracts,
  mockLabour,
} from '@/components/shared/mock-data';
import { useVendors } from '@/hooks/vendors';
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
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
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
  PaymentType,
  PaymentStatus,
  PaymentMethod,
  paymentTypeLabels,
  paymentStatusLabels,
  paymentMethodLabels,
  payeeTypeLabels,
} from '@/types/finance/payment';
import {
  getPayeeInfo,
  formatPayeeName,
  matchesAmountSearch,
} from '@/lib/utils/payment-utils';

const getStatusColor = (status: PaymentStatus) => {
  switch (status) {
    case PaymentStatus.completed: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case PaymentStatus.processing: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case PaymentStatus.pending: {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    case PaymentStatus.failed: {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    case PaymentStatus.cancelled: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
    case PaymentStatus.refunded: {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

const getTypeColor = (type: PaymentType) => {
  switch (type) {
    case PaymentType.invoice: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case PaymentType.salary: {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    }
    case PaymentType.advance: {
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
    }
    case PaymentType.expense: {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    case PaymentType.refund: {
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

export default function PaymentsPage() {
  const router = useRouter();
  const { data: vendors = [] } = useVendors();

  // Create datasets object for utility functions
  const payeeDatasets = {
    vendors,
    employees: mockEmployees,
    subContracts: mockSubContracts,
    labour: mockLabour,
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [payeeTypeFilter, setPayeeTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Filter payments based on search and filters
  const filteredPayments = mockPayments.filter((payment) => {
    // Search filter - includes payee name and flexible amount search
    const searchLower = searchQuery.toLowerCase();
    const payeeInfo = getPayeeInfo(payment, payeeDatasets);
    const payeeName = formatPayeeName(payeeInfo).toLowerCase();

    const matchesSearch =
      !searchQuery ||
      payment.paymentNumber.toLowerCase().includes(searchLower) ||
      payment.transactionId?.toLowerCase().includes(searchLower) ||
      payment.referenceNumber?.toLowerCase().includes(searchLower) ||
      payment.description?.toLowerCase().includes(searchLower) ||
      payment.bankName?.toLowerCase().includes(searchLower) ||
      payeeName.includes(searchLower) ||
      matchesAmountSearch(payment.amount, searchQuery);

    // Status filter
    const matchesStatus =
      statusFilter === 'all' || payment.status === statusFilter;

    // Type filter
    const matchesType = typeFilter === 'all' || payment.type === typeFilter;

    // Method filter
    const matchesMethod =
      methodFilter === 'all' || payment.method === methodFilter;

    // Payee type filter
    const matchesPayeeType =
      payeeTypeFilter === 'all' ||
      getPayeeInfo(payment, payeeDatasets).type === payeeTypeFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesType &&
      matchesMethod &&
      matchesPayeeType
    );
  });

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));

  // Calculate stats
  const totalPayments = mockPayments.length;
  const completedPayments = mockPayments.filter(
    (p) => p.status === PaymentStatus.completed
  ).length;
  const pendingPayments = mockPayments.filter(
    (p) => p.status === PaymentStatus.pending
  ).length;
  const totalAmount = mockPayments
    .filter((p) => p.status === PaymentStatus.completed)
    .reduce((sum, p) => sum + p.amount, 0);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedPayments.map((p) => p.id));
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
    paginatedPayments.length > 0 &&
    selectedIds.length === paginatedPayments.length;

  const hasActiveFilters = Boolean(
    searchQuery ||
      statusFilter !== 'all' ||
      typeFilter !== 'all' ||
      methodFilter !== 'all' ||
      payeeTypeFilter !== 'all'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setMethodFilter('all');
    setPayeeTypeFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Payments"
        description="Track and manage all financial payments"
        actions={
          <Button asChild>
            <Link href={routes.finance.payments.new}>New Payment</Link>
          </Button>
        }
      />

      {/* Statistics Cards */}
      <Card className="gap-0 p-6">
        <div className="sm:divide-border grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:pr-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Total Payments
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {totalPayments}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <CreditCard className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">all time</p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Completed
            </p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {completedPayments}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/30">
                <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              successfully paid
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg p-3 sm:rounded-none sm:px-6">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Pending</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold tracking-tight text-yellow-600 dark:text-yellow-400">
                {pendingPayments}
              </p>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              awaiting payment
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
              completed
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
              placeholder="Search by payment #, payee name, amount, transaction..."
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
              <SelectItem value={PaymentStatus.completed}>
                {paymentStatusLabels[PaymentStatus.completed]}
              </SelectItem>
              <SelectItem value={PaymentStatus.pending}>
                {paymentStatusLabels[PaymentStatus.pending]}
              </SelectItem>
              <SelectItem value={PaymentStatus.processing}>
                {paymentStatusLabels[PaymentStatus.processing]}
              </SelectItem>
              <SelectItem value={PaymentStatus.failed}>
                {paymentStatusLabels[PaymentStatus.failed]}
              </SelectItem>
              <SelectItem value={PaymentStatus.cancelled}>
                {paymentStatusLabels[PaymentStatus.cancelled]}
              </SelectItem>
              <SelectItem value={PaymentStatus.refunded}>
                {paymentStatusLabels[PaymentStatus.refunded]}
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
              <SelectItem value={PaymentType.invoice}>
                {paymentTypeLabels[PaymentType.invoice]}
              </SelectItem>
              <SelectItem value={PaymentType.salary}>
                {paymentTypeLabels[PaymentType.salary]}
              </SelectItem>
              <SelectItem value={PaymentType.advance}>
                {paymentTypeLabels[PaymentType.advance]}
              </SelectItem>
              <SelectItem value={PaymentType.expense}>
                {paymentTypeLabels[PaymentType.expense]}
              </SelectItem>
              <SelectItem value={PaymentType.refund}>
                {paymentTypeLabels[PaymentType.refund]}
              </SelectItem>
              <SelectItem value={PaymentType.other}>
                {paymentTypeLabels[PaymentType.other]}
              </SelectItem>
            </SelectContent>
          </Select>
          {/* Method filter */}
          <Select
            value={methodFilter}
            onValueChange={(v) => {
              setMethodFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value={PaymentMethod.cash}>
                {paymentMethodLabels[PaymentMethod.cash]}
              </SelectItem>
              <SelectItem value={PaymentMethod.bankTransfer}>
                {paymentMethodLabels[PaymentMethod.bankTransfer]}
              </SelectItem>
              <SelectItem value={PaymentMethod.neft}>
                {paymentMethodLabels[PaymentMethod.neft]}
              </SelectItem>
              <SelectItem value={PaymentMethod.rtgs}>
                {paymentMethodLabels[PaymentMethod.rtgs]}
              </SelectItem>
              <SelectItem value={PaymentMethod.upi}>
                {paymentMethodLabels[PaymentMethod.upi]}
              </SelectItem>
              <SelectItem value={PaymentMethod.cheque}>
                {paymentMethodLabels[PaymentMethod.cheque]}
              </SelectItem>
              <SelectItem value={PaymentMethod.card}>
                {paymentMethodLabels[PaymentMethod.card]}
              </SelectItem>
            </SelectContent>
          </Select>
          {/* Payee Type filter */}
          <Select
            value={payeeTypeFilter}
            onValueChange={(v) => {
              setPayeeTypeFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Payee Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payee Types</SelectItem>
              {Object.entries(payeeTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
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
                      <CreditCard className="size-6" />
                    </EmptyErrorMedia>
                    <EmptyHeader>
                      <EmptyTitle>Failed to load payments</EmptyTitle>
                      <EmptyDescription>
                        An unexpected error occurred. Please try again.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </CardContent>
              );
            if (paginatedPayments.length > 0)
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
                      <TableHead>Payment Number</TableHead>
                      <TableHead>Payee Name</TableHead>
                      <TableHead>Payee Type</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayments.map((payment) => {
                      const payeeInfo = getPayeeInfo(payment, payeeDatasets);

                      return (
                        <TableRow
                          key={payment.id}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() =>
                            router.push(
                              routes.finance.payments.detail(payment.id).href
                            )
                          }
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.includes(payment.id)}
                              onCheckedChange={(checked) =>
                                handleSelectOne(payment.id, checked as boolean)
                              }
                              aria-label={`Select ${payment.paymentNumber}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                                <CreditCard className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                  {payment.paymentNumber}
                                </p>
                                {payment.referenceNumber && (
                                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                    Ref: {payment.referenceNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {formatPayeeName(payeeInfo)}
                              </p>
                              {payeeInfo.details && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                  {payeeInfo.details}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                              {payeeTypeLabels[payeeInfo.type]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(payment.type)}>
                              {paymentTypeLabels[payment.type]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {mockProjects.find(
                                (p) => p.id === payment.projectId
                              )?.projectName || 'Unknown Project'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              ₹{payment.amount.toLocaleString('en-IN')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                              <Calendar className="h-3 w-3 text-zinc-400" />
                              <span>
                                {format(payment.paymentDate, 'dd MMM yyyy')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {paymentMethodLabels[payment.method]}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(payment.status)}>
                              {paymentStatusLabels[payment.status]}
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
                    <CreditCard className="size-6" />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>No payments found</EmptyTitle>
                    <EmptyDescription>
                      {hasActiveFilters
                        ? 'Try adjusting your search or filters.'
                        : 'Add your first payment to get started.'}
                    </EmptyDescription>
                  </EmptyHeader>
                  {!hasActiveFilters && (
                    <Button asChild>
                      <Link href={routes.finance.payments.new}>
                        New Payment
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
            {filteredPayments.length === 0
              ? '0 records'
              : `${startIndex + 1}–${Math.min(endIndex, filteredPayments.length)} of ${filteredPayments.length} ${filteredPayments.length === 1 ? 'payment' : 'payments'}`}
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
