'use client';

import { Checkbox } from '@/components/shadcn/checkbox';
import { Badge } from '@/components/shadcn/badge';
import { TableRow, TableCell } from '@/components/shadcn/table';
import { FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
  ConstructionInvoice,
  invoiceTypeLabels,
  invoiceStatusLabels,
  getInvoiceStatusColor,
  getInvoiceTypeColor,
} from '@/types/finance/invoice';

export interface InvoiceRowProps {
  invoice: ConstructionInvoice;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  projectName: string | undefined;
  onClick: () => void;
}

export function InvoiceRow({
  invoice,
  isSelected,
  onSelect,
  projectName,
  onClick,
}: InvoiceRowProps) {
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
          aria-label={`Select ${invoice.invoiceNumber}`}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              {invoice.invoiceNumber}
            </p>
            {invoice.paymentTerms && (
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Terms: {invoice.paymentTerms}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={getInvoiceTypeColor(invoice.type)}>
          {invoiceTypeLabels[invoice.type]}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {projectName}
        </span>
      </TableCell>
      <TableCell>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          ₹{invoice.totalAmount.toLocaleString('en-IN')}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Calendar className="h-3 w-3 text-zinc-400" />
          <span>
            {invoice.issueDate ? format(invoice.issueDate, 'dd MMM yyyy') : '—'}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          {invoice.dueDate ? format(invoice.dueDate, 'dd MMM yyyy') : '—'}
        </span>
      </TableCell>
      <TableCell>
        <Badge className={getInvoiceStatusColor(invoice.status)}>
          {invoiceStatusLabels[invoice.status]}
        </Badge>
      </TableCell>
      <TableCell>
        <span
          className={`font-semibold ${
            invoice.balanceAmount > 0
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-green-600 dark:text-green-400'
          }`}
        >
          ₹{invoice.balanceAmount.toLocaleString('en-IN')}
        </span>
      </TableCell>
    </TableRow>
  );
}
