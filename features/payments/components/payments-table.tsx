'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { routes } from '@/nav';
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { TableCell } from '@/components/shadcn/table';
import { CreditCard, Calendar } from 'lucide-react';
import {
  ConstructionPayment,
  ConstructionPaymentType,
  ConstructionPaymentVoucherStatus,
  ConstructionPaymentMethod,
  paymentTypeLabels,
  paymentStatusLabels,
  paymentMethodLabels,
  payeeTypeLabels,
  getPaymentStatusColor,
  getPaymentTypeColor,
} from '@/types/finance/payment';
import {
  getPayeeInfo,
  formatPayeeName,
  matchesAmountSearch,
  PayeeDatasets,
} from '@/lib/utils/payment-utils';

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  {
    value: ConstructionPaymentVoucherStatus.COMPLETED,
    label: paymentStatusLabels[ConstructionPaymentVoucherStatus.COMPLETED],
  },
  {
    value: ConstructionPaymentVoucherStatus.PENDING,
    label: paymentStatusLabels[ConstructionPaymentVoucherStatus.PENDING],
  },
  {
    value: ConstructionPaymentVoucherStatus.PROCESSING,
    label: paymentStatusLabels[ConstructionPaymentVoucherStatus.PROCESSING],
  },
  {
    value: ConstructionPaymentVoucherStatus.FAILED,
    label: paymentStatusLabels[ConstructionPaymentVoucherStatus.FAILED],
  },
  {
    value: ConstructionPaymentVoucherStatus.CANCELLED,
    label: paymentStatusLabels[ConstructionPaymentVoucherStatus.CANCELLED],
  },
  {
    value: ConstructionPaymentVoucherStatus.REFUNDED,
    label: paymentStatusLabels[ConstructionPaymentVoucherStatus.REFUNDED],
  },
];

const typeOptions = [
  { value: 'all', label: 'All Types' },
  {
    value: ConstructionPaymentType.INVOICE,
    label: paymentTypeLabels[ConstructionPaymentType.INVOICE],
  },
  {
    value: ConstructionPaymentType.SALARY,
    label: paymentTypeLabels[ConstructionPaymentType.SALARY],
  },
  {
    value: ConstructionPaymentType.ADVANCE,
    label: paymentTypeLabels[ConstructionPaymentType.ADVANCE],
  },
  {
    value: ConstructionPaymentType.EXPENSE,
    label: paymentTypeLabels[ConstructionPaymentType.EXPENSE],
  },
  {
    value: ConstructionPaymentType.REFUND,
    label: paymentTypeLabels[ConstructionPaymentType.REFUND],
  },
  {
    value: ConstructionPaymentType.OTHER,
    label: paymentTypeLabels[ConstructionPaymentType.OTHER],
  },
];

const methodOptions = [
  { value: 'all', label: 'All Methods' },
  {
    value: ConstructionPaymentMethod.CASH,
    label: paymentMethodLabels[ConstructionPaymentMethod.CASH],
  },
  {
    value: ConstructionPaymentMethod.BANK_TRANSFER,
    label: paymentMethodLabels[ConstructionPaymentMethod.BANK_TRANSFER],
  },
  {
    value: ConstructionPaymentMethod.NEFT,
    label: paymentMethodLabels[ConstructionPaymentMethod.NEFT],
  },
  {
    value: ConstructionPaymentMethod.RTGS,
    label: paymentMethodLabels[ConstructionPaymentMethod.RTGS],
  },
  {
    value: ConstructionPaymentMethod.UPI,
    label: paymentMethodLabels[ConstructionPaymentMethod.UPI],
  },
  {
    value: ConstructionPaymentMethod.CHEQUE,
    label: paymentMethodLabels[ConstructionPaymentMethod.CHEQUE],
  },
  {
    value: ConstructionPaymentMethod.CARD,
    label: paymentMethodLabels[ConstructionPaymentMethod.CARD],
  },
];

const payeeTypeOptions = [
  { value: 'all', label: 'All Payee Types' },
  ...Object.entries(payeeTypeLabels).map(([value, label]) => ({
    value,
    label,
  })),
];

export interface PaymentsTableProps {
  payments: ConstructionPayment[];
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

  const columns = useMemo<DataTableColumn<ConstructionPayment>[]>(
    () => [
      {
        id: 'paymentNumber',
        header: 'Payment Number',
        cell: (payment) => (
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
        ),
      },
      {
        id: 'payeeName',
        header: 'Payee Name',
        cell: (payment) => {
          const payeeInfo = getPayeeInfo(payment, payeeDatasets);
          return (
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
          );
        },
      },
      {
        id: 'payeeType',
        header: 'Payee Type',
        cell: (payment) => {
          const payeeInfo = getPayeeInfo(payment, payeeDatasets);
          return (
            <TableCell>
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                {payeeTypeLabels[payeeInfo.type]}
              </Badge>
            </TableCell>
          );
        },
      },
      {
        id: 'type',
        header: 'Type',
        cell: (payment) => (
          <TableCell>
            <Badge className={getPaymentTypeColor(payment.type)}>
              {paymentTypeLabels[payment.type]}
            </Badge>
          </TableCell>
        ),
      },
      {
        id: 'project',
        header: 'Project',
        cell: (payment) => (
          <TableCell>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {projectById.get(payment.projectId)?.projectName ||
                'Unknown Project'}
            </span>
          </TableCell>
        ),
      },
      {
        id: 'amount',
        header: 'Amount',
        cell: (payment) => (
          <TableCell>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              ₹{payment.amount.toLocaleString('en-IN')}
            </span>
          </TableCell>
        ),
      },
      {
        id: 'date',
        header: 'Date',
        cell: (payment) => (
          <TableCell>
            <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
              <Calendar className="h-3 w-3 text-zinc-400" />
              <span>
                {payment.paymentDate
                  ? format(payment.paymentDate, 'dd MMM yyyy')
                  : '—'}
              </span>
            </div>
          </TableCell>
        ),
      },
      {
        id: 'method',
        header: 'Method',
        cell: (payment) => (
          <TableCell>
            <span className="text-zinc-700 dark:text-zinc-300">
              {paymentMethodLabels[payment.method]}
            </span>
          </TableCell>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (payment) => (
          <TableCell>
            <Badge className={getPaymentStatusColor(payment.status)}>
              {paymentStatusLabels[payment.status]}
            </Badge>
          </TableCell>
        ),
      },
    ],
    [payeeDatasets, projectById]
  );

  const filters = useMemo<DataTableFilter<ConstructionPayment>[]>(
    () => [
      {
        id: 'status',
        placeholder: 'Status',
        options: statusOptions,
        predicate: (payment, value) => payment.status === value,
      },
      {
        id: 'type',
        placeholder: 'Type',
        options: typeOptions,
        predicate: (payment, value) => payment.type === value,
      },
      {
        id: 'method',
        placeholder: 'Method',
        options: methodOptions,
        predicate: (payment, value) => payment.method === value,
      },
      {
        id: 'payeeType',
        placeholder: 'Payee Type',
        options: payeeTypeOptions,
        predicate: (payment, value) =>
          getPayeeInfo(payment, payeeDatasets).type === value,
      },
    ],
    [payeeDatasets]
  );

  return (
    <DataTable<ConstructionPayment>
      data={payments}
      columns={columns}
      getRowId={(payment) => payment.id}
      isLoading={isLoading}
      isError={isError}
      enableSelection
      searchPlaceholder="Search by payment #, payee name, amount, transaction..."
      searchPredicate={(payment, query) => {
        const searchLower = query.toLowerCase();
        const payeeInfo = getPayeeInfo(payment, payeeDatasets);
        const payeeName = payeeInfo.name.toLowerCase();
        const payeeCompany = payeeInfo.company?.toLowerCase() ?? '';
        return (
          payment.paymentNumber.toLowerCase().includes(searchLower) ||
          (payment.transactionId?.toLowerCase().includes(searchLower) ??
            false) ||
          (payment.referenceNumber?.toLowerCase().includes(searchLower) ??
            false) ||
          (payment.description?.toLowerCase().includes(searchLower) ?? false) ||
          (payment.bankName?.toLowerCase().includes(searchLower) ?? false) ||
          payeeName.includes(searchLower) ||
          payeeCompany.includes(searchLower) ||
          matchesAmountSearch(payment.amount, query)
        );
      }}
      filters={filters}
      onRowClick={(payment) =>
        router.push(routes.finance.payments.detail(payment.id).href)
      }
      entityNoun={{ one: 'payment', many: 'payments' }}
      errorIcon={<CreditCard className="size-6" />}
      errorTitle="Failed to load payments"
      emptyIcon={<CreditCard className="size-6" />}
      emptyTitle="No payments found"
      emptyDescription="Add your first payment to get started."
      emptyAction={
        <Button asChild>
          <Link href={routes.finance.payments.new}>New Payment</Link>
        </Button>
      }
    />
  );
}
