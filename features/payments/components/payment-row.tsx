'use client';

import { Checkbox } from '@/components/shadcn/checkbox';
import { Badge } from '@/components/shadcn/badge';
import { TableRow, TableCell } from '@/components/shadcn/table';
import { CreditCard, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
  ConstructionPayment,
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
  PayeeDatasets,
} from '@/lib/utils/payment-utils';

export interface PaymentRowProps {
  payment: ConstructionPayment;
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
        <Badge className={getPaymentTypeColor(payment.type)}>
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
          <span>
            {payment.paymentDate
              ? format(payment.paymentDate, 'dd MMM yyyy')
              : '—'}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-zinc-700 dark:text-zinc-300">
          {paymentMethodLabels[payment.method]}
        </span>
      </TableCell>
      <TableCell>
        <Badge className={getPaymentStatusColor(payment.status)}>
          {paymentStatusLabels[payment.status]}
        </Badge>
      </TableCell>
    </TableRow>
  );
}
