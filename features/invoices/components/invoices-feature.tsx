'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { routes } from '@/nav';
import { DataTable, type DataTableColumn } from '@/components/common';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { TableCell } from '@/components/shadcn/table';
import { FileText, Calendar } from 'lucide-react';
import {
  ConstructionInvoice,
  ConstructionInvoiceType,
  ConstructionInvoiceStatus,
  invoiceTypeLabels,
  invoiceStatusLabels,
  getInvoiceStatusColor,
} from '@/types/finance/invoice';
import { Project } from '@tornotron/echno-core/project/types';
import { Vendor } from '@tornotron/echno-core/vendor/types';
import { InvoiceActions } from './invoice-actions';

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  {
    value: ConstructionInvoiceStatus.DRAFT,
    label: invoiceStatusLabels[ConstructionInvoiceStatus.DRAFT],
  },
  {
    value: ConstructionInvoiceStatus.PENDING,
    label: invoiceStatusLabels[ConstructionInvoiceStatus.PENDING],
  },
  {
    value: ConstructionInvoiceStatus.APPROVED,
    label: invoiceStatusLabels[ConstructionInvoiceStatus.APPROVED],
  },
  {
    value: ConstructionInvoiceStatus.SENT,
    label: invoiceStatusLabels[ConstructionInvoiceStatus.SENT],
  },
  {
    value: ConstructionInvoiceStatus.PARTIALLY_PAID,
    label: invoiceStatusLabels[ConstructionInvoiceStatus.PARTIALLY_PAID],
  },
  {
    value: ConstructionInvoiceStatus.PAID,
    label: invoiceStatusLabels[ConstructionInvoiceStatus.PAID],
  },
  {
    value: ConstructionInvoiceStatus.OVERDUE,
    label: invoiceStatusLabels[ConstructionInvoiceStatus.OVERDUE],
  },
  {
    value: ConstructionInvoiceStatus.CANCELLED,
    label: invoiceStatusLabels[ConstructionInvoiceStatus.CANCELLED],
  },
  {
    value: ConstructionInvoiceStatus.DISPUTED,
    label: invoiceStatusLabels[ConstructionInvoiceStatus.DISPUTED],
  },
];

const typeOptions = [
  { value: 'all', label: 'All Types' },
  {
    value: ConstructionInvoiceType.PURCHASE,
    label: invoiceTypeLabels[ConstructionInvoiceType.PURCHASE],
  },
  {
    value: ConstructionInvoiceType.SALES,
    label: invoiceTypeLabels[ConstructionInvoiceType.SALES],
  },
  {
    value: ConstructionInvoiceType.EXPENSE,
    label: invoiceTypeLabels[ConstructionInvoiceType.EXPENSE],
  },
  {
    value: ConstructionInvoiceType.SERVICE,
    label: invoiceTypeLabels[ConstructionInvoiceType.SERVICE],
  },
];

interface InvoicesFeatureProps {
  invoices: ConstructionInvoice[];
  projects: Project[];
  vendors: Vendor[];
  isLoading?: boolean;
  isError?: boolean;
}

export function InvoicesFeature({
  invoices,
  projects,
  vendors,
  isLoading = false,
  isError = false,
}: InvoicesFeatureProps) {
  const router = useRouter();

  const projectNameById = useMemo(() => {
    const m = new Map<number, string | undefined>();
    for (const project of projects) m.set(project.id, project.projectName);
    return m;
  }, [projects]);

  const vendorNameById = useMemo(() => {
    const m = new Map<number, string | undefined>();
    for (const vendor of vendors) m.set(vendor.id, vendor.name);
    return m;
  }, [vendors]);

  const columns = useMemo<DataTableColumn<ConstructionInvoice>[]>(
    () => [
      {
        id: 'invoiceNumber',
        header: 'Invoice Number',
        cell: (invoice) => (
          <TableCell>
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {invoice.invoiceNumber}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  {invoiceTypeLabels[invoice.type]}
                </p>
              </div>
            </div>
          </TableCell>
        ),
      },
      {
        id: 'project',
        header: 'Project',
        cell: (invoice) => (
          <TableCell>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {projectNameById.get(invoice.projectId) ?? '—'}
            </span>
          </TableCell>
        ),
      },
      {
        id: 'vendor',
        header: 'Vendor/Payee',
        cell: (invoice) => (
          <TableCell>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {invoice.vendorId
                ? (vendorNameById.get(invoice.vendorId) ??
                  `Vendor #${invoice.vendorId}`)
                : '—'}
            </span>
          </TableCell>
        ),
      },
      {
        id: 'issueDate',
        header: 'Invoice Date',
        cell: (invoice) => (
          <TableCell>
            <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
              <Calendar className="h-3 w-3 text-zinc-400" />
              <span>
                {invoice.issueDate
                  ? format(invoice.issueDate, 'dd MMM yyyy')
                  : '—'}
              </span>
            </div>
          </TableCell>
        ),
      },
      {
        id: 'dueDate',
        header: 'Due Date',
        cell: (invoice) => (
          <TableCell>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {invoice.dueDate ? format(invoice.dueDate, 'dd MMM yyyy') : '—'}
            </span>
          </TableCell>
        ),
      },
      {
        id: 'amount',
        header: 'Amount',
        cell: (invoice) => (
          <TableCell>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              ₹{invoice.totalAmount.toLocaleString('en-IN')}
            </span>
          </TableCell>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (invoice) => (
          <TableCell>
            <Badge className={getInvoiceStatusColor(invoice.status)}>
              {invoiceStatusLabels[invoice.status]}
            </Badge>
          </TableCell>
        ),
      },
      {
        id: 'paymentMethod',
        header: 'Payment Method',
        cell: (invoice) => (
          <TableCell>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {invoice.paymentMethod || '—'}
            </span>
          </TableCell>
        ),
      },
      {
        id: 'actions',
        header: <span className="sr-only">Actions</span>,
        headClassName: 'w-12',
        cell: (invoice) => (
          <TableCell>
            <InvoiceActions invoice={invoice} variant="menu" />
          </TableCell>
        ),
      },
    ],
    [projectNameById, vendorNameById]
  );

  return (
    <DataTable<ConstructionInvoice>
      data={invoices}
      columns={columns}
      getRowId={(invoice) => invoice.id}
      isLoading={isLoading}
      isError={isError}
      enableSelection
      searchPlaceholder="Search by invoice number, notes..."
      searchPredicate={(invoice, query) => {
        const searchLower = query.toLowerCase();
        return (
          invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
          (invoice.notes?.toLowerCase().includes(searchLower) ?? false) ||
          (invoice.paymentTerms?.toLowerCase().includes(searchLower) ?? false)
        );
      }}
      filters={[
        {
          id: 'status',
          placeholder: 'Status',
          options: statusOptions,
          predicate: (invoice, value) => invoice.status === value,
        },
        {
          id: 'type',
          placeholder: 'Type',
          options: typeOptions,
          predicate: (invoice, value) => invoice.type === value,
        },
      ]}
      onRowClick={(invoice) =>
        router.push(routes.finance.invoices.detail(invoice.id).href)
      }
      entityNoun={{ one: 'invoice', many: 'invoices' }}
      errorIcon={<FileText className="size-6" />}
      errorTitle="Failed to load invoices"
      emptyIcon={<FileText className="size-6" />}
      emptyTitle="No invoices found"
      emptyDescription="Add your first invoice to get started."
      emptyAction={
        <Button asChild>
          <Link href={routes.finance.invoices.new}>New Invoice</Link>
        </Button>
      }
    />
  );
}
