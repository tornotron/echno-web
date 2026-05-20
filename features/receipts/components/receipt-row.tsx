'use client';

import { Checkbox } from '@/components/shadcn/checkbox';
import { Badge } from '@/components/shadcn/badge';
import { TableRow, TableCell } from '@/components/shadcn/table';
import { Receipt as ReceiptIcon, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
  Receipt,
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

export interface ReceiptRowProps {
  receipt: Receipt;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  projectName: string;
  onClick: () => void;
}

export function ReceiptRow({
  receipt,
  isSelected,
  onSelect,
  projectName,
  onClick,
}: ReceiptRowProps) {
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
          {projectName}
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
          <span>{format(receipt.receiptDate, 'dd MMM yyyy')}</span>
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
}
