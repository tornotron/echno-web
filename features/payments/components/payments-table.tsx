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
import { CreditCard, Search, Loader2 } from 'lucide-react';
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
  Payment,
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
  matchesAmountSearch,
  PayeeDatasets,
} from '@/lib/utils/payment-utils';
import { PaymentRow } from './payment-row';

export interface PaymentsTableProps {
  payments: Payment[];
  isLoading: boolean;
  isError: boolean;
  payeeDatasets: PayeeDatasets;
  projectById: Map<number, { projectName: string }>;
}

export function PaymentsTable({
  payments,
  isLoading,
  isError,
  payeeDatasets,
  projectById,
}: PaymentsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [payeeTypeFilter, setPayeeTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const searchLower = searchQuery.toLowerCase();
      const payeeInfo = getPayeeInfo(payment, payeeDatasets);
      const payeeName = payeeInfo.name.toLowerCase();
      const payeeCompany = payeeInfo.company?.toLowerCase() ?? '';

      const matchesSearch =
        !searchQuery ||
        payment.paymentNumber.toLowerCase().includes(searchLower) ||
        payment.transactionId?.toLowerCase().includes(searchLower) ||
        payment.referenceNumber?.toLowerCase().includes(searchLower) ||
        payment.description?.toLowerCase().includes(searchLower) ||
        payment.bankName?.toLowerCase().includes(searchLower) ||
        payeeName.includes(searchLower) ||
        payeeCompany.includes(searchLower) ||
        matchesAmountSearch(payment.amount, searchQuery);

      const matchesStatus =
        statusFilter === 'all' || payment.status === statusFilter;

      const matchesType = typeFilter === 'all' || payment.type === typeFilter;

      const matchesMethod =
        methodFilter === 'all' || payment.method === methodFilter;

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
  }, [
    payments,
    searchQuery,
    statusFilter,
    typeFilter,
    methodFilter,
    payeeTypeFilter,
    payeeDatasets,
  ]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));

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
    paginatedPayments.every((p) => selectedIds.includes(p.id));

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
                  {paginatedPayments.map((payment) => (
                    <PaymentRow
                      key={payment.id}
                      payment={payment}
                      isSelected={selectedIds.includes(payment.id)}
                      onSelect={(checked) =>
                        handleSelectOne(payment.id, checked)
                      }
                      projectName={
                        projectById.get(payment.projectId)?.projectName ||
                        'Unknown Project'
                      }
                      payeeDatasets={payeeDatasets}
                      onClick={() =>
                        router.push(
                          routes.finance.payments.detail(payment.id).href
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
                    <Link href={routes.finance.payments.new}>New Payment</Link>
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
  );
}
