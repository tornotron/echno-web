'use client';

import { Checkbox } from '@/components/shadcn/checkbox';
import { Badge } from '@/components/shadcn/badge';
import { TableRow, TableCell } from '@/components/shadcn/table';
import { CreditCard, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
  Payment,
  PaymentType,
  PaymentStatus,
  paymentTypeLabels,
  paymentStatusLabels,
  paymentMethodLabels,
  payeeTypeLabels,
} from '@/types/finance/payment';
import {
  getPayeeInfo,
  formatPayeeName,
  PayeeDatasets,
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

export interface PaymentRowProps {
  payment: Payment;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  projectName: string;
  onClick: () => void;
  payeeDatasets: PayeeDatasets;
}

export function PaymentRow({
  payment,
  isSelected,
  onSelect,
  projectName,
  onClick,
  payeeDatasets,
}: PaymentRowProps) {
  const payeeInfo = getPayeeInfo(payment, payeeDatasets);

  return (
    <TableRow
      role="button"
      tabIndex={0}
      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === ' ') {
          e.preventDefault();
          onClick();
        } else if (e.key === 'Enter') {
          onClick();
        }
      }}
    >
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(checked as boolean)}
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
          {projectName}
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
          <span>{format(payment.paymentDate, 'dd MMM yyyy')}</span>
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
}
