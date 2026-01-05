'use client';

import { useState, useMemo } from 'react';
import {
  mockPayments,
  mockProjects,
  mockVendors,
  mockEmployees,
  mockSubContracts,
  mockLabour,
} from '@/components/shared/mock-data';
import { AppLayout, Pagination, SearchAndFilter } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
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
  // Create datasets object for utility functions
  const payeeDatasets = {
    vendors: mockVendors,
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
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Payments
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Track and manage all financial payments
            </p>
          </div>
          <Button asChild>
            <Link href="/users/dashboard/finance/payments/new">
              <CreditCard className="mr-2 h-4 w-4" />
              New Payment
            </Link>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {totalPayments}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {completedPayments}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {pendingPayments}
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
          searchPlaceholder="Search by payment #, payee name, amount, transaction..."
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          filters={[
            {
              placeholder: 'Status',
              options: [
                { value: 'all', label: 'All Statuses' },
                {
                  value: PaymentStatus.completed,
                  label: paymentStatusLabels[PaymentStatus.completed],
                },
                {
                  value: PaymentStatus.pending,
                  label: paymentStatusLabels[PaymentStatus.pending],
                },
                {
                  value: PaymentStatus.processing,
                  label: paymentStatusLabels[PaymentStatus.processing],
                },
                {
                  value: PaymentStatus.failed,
                  label: paymentStatusLabels[PaymentStatus.failed],
                },
                {
                  value: PaymentStatus.cancelled,
                  label: paymentStatusLabels[PaymentStatus.cancelled],
                },
                {
                  value: PaymentStatus.refunded,
                  label: paymentStatusLabels[PaymentStatus.refunded],
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
                  value: PaymentType.invoice,
                  label: paymentTypeLabels[PaymentType.invoice],
                },
                {
                  value: PaymentType.salary,
                  label: paymentTypeLabels[PaymentType.salary],
                },
                {
                  value: PaymentType.advance,
                  label: paymentTypeLabels[PaymentType.advance],
                },
                {
                  value: PaymentType.expense,
                  label: paymentTypeLabels[PaymentType.expense],
                },
                {
                  value: PaymentType.refund,
                  label: paymentTypeLabels[PaymentType.refund],
                },
                {
                  value: PaymentType.other,
                  label: paymentTypeLabels[PaymentType.other],
                },
              ],
              value: typeFilter,
              onChange: (value) => {
                setTypeFilter(value);
                setCurrentPage(1);
              },
            },
            {
              placeholder: 'Method',
              options: [
                { value: 'all', label: 'All Methods' },
                {
                  value: PaymentMethod.cash,
                  label: paymentMethodLabels[PaymentMethod.cash],
                },
                {
                  value: PaymentMethod.bankTransfer,
                  label: paymentMethodLabels[PaymentMethod.bankTransfer],
                },
                {
                  value: PaymentMethod.neft,
                  label: paymentMethodLabels[PaymentMethod.neft],
                },
                {
                  value: PaymentMethod.rtgs,
                  label: paymentMethodLabels[PaymentMethod.rtgs],
                },
                {
                  value: PaymentMethod.upi,
                  label: paymentMethodLabels[PaymentMethod.upi],
                },
                {
                  value: PaymentMethod.cheque,
                  label: paymentMethodLabels[PaymentMethod.cheque],
                },
                {
                  value: PaymentMethod.card,
                  label: paymentMethodLabels[PaymentMethod.card],
                },
              ],
              value: methodFilter,
              onChange: (value) => {
                setMethodFilter(value);
                setCurrentPage(1);
              },
            },
            {
              placeholder: 'Payee Type',
              options: [
                { value: 'all', label: 'All Payee Types' },
                ...Object.entries(payeeTypeLabels).map(([value, label]) => ({
                  value,
                  label,
                })),
              ],
              value: payeeTypeFilter,
              onChange: (value) => {
                setPayeeTypeFilter(value);
                setCurrentPage(1);
              },
            },
          ]}
        />

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {startIndex + 1} to{' '}
            {Math.min(endIndex, filteredPayments.length)} of{' '}
            {filteredPayments.length} payments
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

        {/* Payments Table */}
        {filteredPayments.length > 0 ? (
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
                          (globalThis.location.href = `/dashboard/finance/payments/${payment.id}`)
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
            <CardContent className="flex h-64 items-center justify-center">
              <div className="text-center">
                <CreditCard className="mx-auto h-12 w-12 text-zinc-400" />
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  No payments found
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {hasActiveFilters
                    ? 'Try adjusting your filters'
                    : 'Get started by making a new payment'}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
