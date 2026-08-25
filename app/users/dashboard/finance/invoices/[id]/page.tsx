'use client';

import { use, useState } from 'react';
import { useVendors } from '@tornotron/echno-core/vendor/hooks';
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { useInvoiceById } from '@/hooks/invoices';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Separator } from '@/components/shadcn/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  FileText,
  Edit,
  Download,
  DollarSign,
  Building,
  Hash,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  UserCheck,
  Wallet,
  BookOpen,
} from 'lucide-react';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';
import { PageHeader } from '@/components/common';
import Link from 'next/link';
import { routes } from '@/nav';
import { employeeFilterHref } from '@/hooks/use-employee-filter';
import { format } from 'date-fns';
import {
  ConstructionInvoiceStatus,
  invoiceTypeLabels,
  invoiceStatusLabels,
  getInvoiceStatusColor,
  getInvoiceTypeColor,
} from '@/types/finance/invoice';
import { InvoiceActions } from '@/features/invoices/components/invoice-actions';
import { invoicesService } from '@/services/invoices-service';
import { toast } from '@/lib/styles/toast-styles';

interface InvoiceDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(value?: string): string {
  return value ? format(value, 'dd MMM yyyy') : '—';
}

function formatDateTime(value?: string): string {
  return value ? format(value, 'dd MMM yyyy, HH:mm') : '—';
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const {
    data: vendors = [],
    isPending: isVendorsLoading,
    isError: isVendorsError,
  } = useVendors();
  const { data: employees = [] } = useEmployeeLookup();
  const {
    data: invoice,
    isPending: isInvoiceLoading,
    isError: isInvoiceError,
  } = useInvoiceById(id);

  const isLoading = isVendorsLoading || isInvoiceLoading;
  const isError = isVendorsError || isInvoiceError;
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const getVendorName = (vendorId: number): string => {
    const vendor = vendors.find((v) => v.id === vendorId);
    return vendor?.name || `Vendor #${vendorId}`;
  };

  const getEmployeeName = (employeeId?: number): string => {
    if (!employeeId) return '—';
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.name || `User #${employeeId}`;
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  if (isError)
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <FileText className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Failed to load invoice</EmptyTitle>
          <EmptyDescription>
            An unexpected error occurred. Please try again.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.finance.invoices.href}>Back to Invoices</Link>
        </Button>
      </Empty>
    );
  if (!invoice)
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <FileText className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Invoice not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or does not exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.finance.invoices.href}>Back to Invoices</Link>
        </Button>
      </Empty>
    );

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      const blob = await invoicesService.downloadPdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${invoice.invoiceNumber || 'invoice'}.pdf`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download the invoice PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const paymentPercentage =
    invoice.totalAmount > 0
      ? (invoice.paidAmount / invoice.totalAmount) * 100
      : 0;

  const hasAuditTrail =
    !!invoice.submittedBy ||
    !!invoice.submittedAt ||
    !!invoice.approvedBy ||
    !!invoice.approvedAt ||
    !!invoice.paymentRecordedBy ||
    !!invoice.journalEntryId ||
    !!invoice.reversalJournalEntryId;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeader
        title={invoice.invoiceNumber}
        description={invoice.notes}
        actions={
          <>
            <Badge className={getInvoiceStatusColor(invoice.status)}>
              {invoiceStatusLabels[invoice.status]}
            </Badge>
            <Badge className={getInvoiceTypeColor(invoice.type)}>
              {invoiceTypeLabels[invoice.type]}
            </Badge>
            <InvoiceActions invoice={invoice} variant="buttons" />
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
            >
              {isDownloadingPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isDownloadingPdf ? 'Preparing…' : 'Download PDF'}
            </Button>
            <Button asChild>
              <Link href={routes.finance.invoices.detail(invoice.id).edit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </>
        }
      />

      {/* Header summary: vendor/payee, project, total */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <Building className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Vendor/Payee
              </p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {invoice.vendorId ? getVendorName(invoice.vendorId) : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Project
              </p>
              {invoice.projectId ? (
                <Link
                  href={
                    routes.projects.allProjects.detail(
                      invoice.projectId
                    ).href
                  }
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  View project #{invoice.projectId}
                </Link>
              ) : (
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  —
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Total Amount
              </p>
              <p className="font-bold text-zinc-900 dark:text-zinc-100">
                ₹{invoice.totalAmount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Amount Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Amount</CardTitle>
              <CardDescription>Totals and balance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-zinc-50 p-6 dark:bg-zinc-800/50">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Subtotal
                    </span>
                    <span className="font-medium">
                      ₹{invoice.subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {invoice.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Tax
                      </span>
                      <span className="font-medium">
                        ₹{invoice.taxAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {invoice.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Discount
                      </span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        -₹{invoice.discountAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      ₹{invoice.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Information */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
              <CardDescription>Dates, terms, and tax</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-zinc-600 dark:text-zinc-400">
                    Invoice Date
                  </dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatDate(invoice.issueDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-zinc-600 dark:text-zinc-400">
                    Due Date
                  </dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatDate(invoice.dueDate)}
                  </dd>
                </div>
                {invoice.purchaseOrderId && (
                  <div>
                    <dt className="text-sm text-zinc-600 dark:text-zinc-400">
                      PO Number
                    </dt>
                    <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                      PO #{invoice.purchaseOrderId}
                    </dd>
                  </div>
                )}
                {invoice.paymentTerms && (
                  <div>
                    <dt className="text-sm text-zinc-600 dark:text-zinc-400">
                      Payment Terms
                    </dt>
                    <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                      {invoice.paymentTerms}
                    </dd>
                  </div>
                )}
                {invoice.gstNumber && (
                  <div>
                    <dt className="text-sm text-zinc-600 dark:text-zinc-400">
                      GST/Tax Number
                    </dt>
                    <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                      {invoice.gstNumber}
                    </dd>
                  </div>
                )}
                {invoice.taxType && (
                  <div>
                    <dt className="text-sm text-zinc-600 dark:text-zinc-400">
                      Tax Type
                    </dt>
                    <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                      {invoice.taxType}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-zinc-600 dark:text-zinc-400">
                    Discount
                  </dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                    ₹{invoice.discountAmount.toLocaleString('en-IN')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-zinc-600 dark:text-zinc-400">
                    Tax
                  </dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                    ₹{invoice.taxAmount.toLocaleString('en-IN')}
                  </dd>
                </div>
              </dl>
              {invoice.notes && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Notes
                    </p>
                    <p className="text-zinc-900 dark:text-zinc-100">
                      {invoice.notes}
                    </p>
                  </div>
                </>
              )}
              {invoice.termsAndConditions && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Terms and Conditions
                    </p>
                    <p className="text-zinc-900 dark:text-zinc-100">
                      {invoice.termsAndConditions}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>Invoice details and breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="min-w-[250px]">
                        Description
                      </TableHead>
                      <TableHead className="min-w-[140px]">
                        Cost Category
                      </TableHead>
                      <TableHead className="min-w-[100px]">Quantity</TableHead>
                      <TableHead className="min-w-[100px]">Unit</TableHead>
                      <TableHead className="min-w-[120px]">
                        Unit Price
                      </TableHead>
                      <TableHead className="min-w-[100px]">Tax</TableHead>
                      <TableHead className="min-w-[120px]">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.lines.map((item, index) => (
                      <TableRow key={item.id || index}>
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.description}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {item.costCategoryName ?? '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">
                          ₹{item.unitPrice.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{item.taxAmount.toLocaleString('en-IN')} (
                          {item.taxRate}%)
                        </TableCell>
                        <TableCell className="text-right font-bold text-zinc-900 dark:text-zinc-100">
                          ₹{item.total.toLocaleString('en-IN')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>Amounts and settlement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Amount Paid
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    ₹{invoice.paidAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Balance Due
                  </span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    ₹{invoice.balanceAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Payment Method
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {invoice.paymentMethod || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Payment Date
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatDate(invoice.paymentDate)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Payment Progress</span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {paymentPercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${Math.min(paymentPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {invoice.balanceAmount > 0 ? (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/20 dark:bg-orange-900/10">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="font-semibold text-orange-900 dark:text-orange-100">
                        Outstanding Balance
                      </p>
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        ₹{invoice.balanceAmount.toLocaleString('en-IN')}
                        {invoice.status ===
                          ConstructionInvoiceStatus.OVERDUE && (
                          <span className="ml-1">- OVERDUE</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/20 dark:bg-green-900/10">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        Fully Paid
                      </p>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        No outstanding balance.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval / Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle>Approval / Audit Trail</CardTitle>
              <CardDescription>Workflow history</CardDescription>
            </CardHeader>
            <CardContent>
              {hasAuditTrail ? (
                <ul className="space-y-4">
                  {(invoice.submittedBy || invoice.submittedAt) && (
                    <li className="flex items-start space-x-3">
                      <Send className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm font-medium">Submitted</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {invoice.submittedBy ? (
                            <Link
                              href={employeeFilterHref(
                                routes.finance.invoices.href,
                                invoice.submittedBy,
                                'submitter'
                              )}
                              className="font-medium hover:underline"
                            >
                              {getEmployeeName(invoice.submittedBy)}
                            </Link>
                          ) : (
                            getEmployeeName(invoice.submittedBy)
                          )}{' '}
                          on {formatDateTime(invoice.submittedAt)}
                        </p>
                      </div>
                    </li>
                  )}
                  {(invoice.approvedBy || invoice.approvedAt) && (
                    <li className="flex items-start space-x-3">
                      <UserCheck className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium">Approved</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {invoice.approvedBy ? (
                            <Link
                              href={employeeFilterHref(
                                routes.finance.invoices.href,
                                invoice.approvedBy,
                                'approver'
                              )}
                              className="font-medium hover:underline"
                            >
                              {getEmployeeName(invoice.approvedBy)}
                            </Link>
                          ) : (
                            getEmployeeName(invoice.approvedBy)
                          )}{' '}
                          on {formatDateTime(invoice.approvedAt)}
                        </p>
                      </div>
                    </li>
                  )}
                  {invoice.paymentRecordedBy && (
                    <li className="flex items-start space-x-3">
                      <Wallet className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm font-medium">
                          Payment recorded by
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {invoice.paymentRecordedBy ? (
                            <Link
                              href={employeeFilterHref(
                                routes.finance.invoices.href,
                                invoice.paymentRecordedBy,
                                'payment-recorder'
                              )}
                              className="font-medium hover:underline"
                            >
                              {getEmployeeName(invoice.paymentRecordedBy)}
                            </Link>
                          ) : (
                            getEmployeeName(invoice.paymentRecordedBy)
                          )}
                        </p>
                      </div>
                    </li>
                  )}
                  {invoice.journalEntryId && (
                    <li className="flex items-start space-x-3">
                      <BookOpen className="mt-0.5 h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                      <div>
                        <p className="text-sm font-medium">Journal Entry</p>
                        <p className="font-mono text-xs break-all text-zinc-600 dark:text-zinc-400">
                          {invoice.journalEntryId}
                        </p>
                      </div>
                    </li>
                  )}
                  {invoice.reversalJournalEntryId && (
                    <li className="flex items-start space-x-3">
                      <BookOpen className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="text-sm font-medium">
                          Reversal Journal Entry
                        </p>
                        <p className="font-mono text-xs break-all text-zinc-600 dark:text-zinc-400">
                          {invoice.reversalJournalEntryId}
                        </p>
                      </div>
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No workflow activity yet. This invoice has not been submitted
                  for approval.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Related Records */}
          <Card>
            <CardHeader>
              <CardTitle>Related Records</CardTitle>
              <CardDescription>Linked documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoice.purchaseOrderId && (
                <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium">Purchase Order</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        PO ID: {invoice.purchaseOrderId}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {invoice.vendorId && (
                <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="text-sm font-medium">Vendor</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {getVendorName(invoice.vendorId)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {invoice.gstNumber && (
                <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex items-center space-x-3">
                    <Hash className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-sm font-medium">GST/Tax Number</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {invoice.gstNumber}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {!invoice.purchaseOrderId &&
                !invoice.vendorId &&
                !invoice.gstNumber && (
                  <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                    No related records
                  </p>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
