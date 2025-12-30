'use client';

import { notFound } from 'next/navigation';
import { use } from 'react';
import {
  mockInvoices,
  mockMembers,
  mockVendors,
} from '@/components/shared/mock-data';
import { AppLayout } from '@/components/common/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Edit,
  Download,
  DollarSign,
  Calendar,
  Building,
  Hash,
  CheckCircle,
  Paperclip,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  InvoiceType,
  InvoiceStatus,
  invoiceTypeLabels,
  invoiceStatusLabels,
} from '@/types/finance/invoice';

interface InvoiceDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const getStatusColor = (status: InvoiceStatus) => {
  switch (status) {
    case InvoiceStatus.paid: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case InvoiceStatus.partiallyPaid: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case InvoiceStatus.pending: {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    case InvoiceStatus.sent: {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    }
    case InvoiceStatus.draft: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
    case InvoiceStatus.overdue: {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    }
    case InvoiceStatus.cancelled: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
    case InvoiceStatus.disputed: {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

const getTypeColor = (type: InvoiceType) => {
  switch (type) {
    case InvoiceType.purchase: {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
    case InvoiceType.sales: {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
    case InvoiceType.expense: {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    }
    case InvoiceType.service: {
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
    }
    default: {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
    }
  }
};

const getUserName = (userId: number): string => {
  const member = mockMembers.find((m) => m.id === userId);
  return member?.memberName || `User #${userId}`;
};

const getVendorName = (vendorId: number): string => {
  const vendor = mockVendors.find((v) => v.id === vendorId);
  return vendor?.companyName || `Vendor #${vendorId}`;
};

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const resolvedParams = use(params);
  const invoice = mockInvoices.find(
    (i) => i.id === Number.parseInt(resolvedParams.id)
  );

  if (!invoice) {
    notFound();
  }

  const paymentPercentage = (invoice.paidAmount / invoice.totalAmount) * 100;

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start space-x-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="mb-2 flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {invoice.invoiceNumber}
                  </h1>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoiceStatusLabels[invoice.status]}
                  </Badge>
                  <Badge className={getTypeColor(invoice.type)}>
                    {invoiceTypeLabels[invoice.type]}
                  </Badge>
                </div>
                <p className="mb-2 text-zinc-600 dark:text-zinc-400">
                  Due on {format(invoice.dueDate, 'dd MMM yyyy')}
                </p>
                <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Issued on {format(invoice.issueDate, 'dd MMM yyyy')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Link
                href={`/users/dashboard/finance/invoices/${invoice.id}/edit`}
              >
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Invoice Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Amount Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Amount</CardTitle>
                <CardDescription>Payment summary and balance</CardDescription>
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
                          Tax ({invoice.lineItems[0]?.taxRate || 18}%)
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
                      <span className="text-lg font-semibold">
                        Total Amount
                      </span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        ₹{invoice.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Amount Paid</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        ₹{invoice.paidAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Balance Due</span>
                      <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        ₹{invoice.balanceAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Progress */}
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
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        <th className="pb-3 text-left font-medium">
                          Description
                        </th>
                        <th className="pb-3 text-center font-medium">Qty</th>
                        <th className="pb-3 text-right font-medium">
                          Unit Price
                        </th>
                        <th className="pb-3 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lineItems.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-zinc-200 dark:border-zinc-800"
                        >
                          <td className="py-3 text-zinc-900 dark:text-zinc-100">
                            {item.description}
                          </td>
                          <td className="py-3 text-center text-zinc-600 dark:text-zinc-400">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="py-3 text-right text-zinc-600 dark:text-zinc-400">
                            ₹{item.unitPrice.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                            ₹{item.total.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Information */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Information</CardTitle>
                <CardDescription>Terms and payment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.paymentTerms && (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Payment Terms
                        </p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {invoice.paymentTerms}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                {invoice.paymentMethod && (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Payment Method
                        </p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {invoice.paymentMethod}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                {invoice.gstNumber && (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                        <Hash className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          GST/Tax Number
                        </p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {invoice.gstNumber}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                {invoice.vendorId && (
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                      <Building className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Vendor
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {getVendorName(invoice.vendorId)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes and Attachments */}
            {(invoice.notes ||
              (invoice.attachments && invoice.attachments.length > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                  <CardDescription>Notes and attachments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {invoice.notes && (
                    <div>
                      <p className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        Notes
                      </p>
                      <p className="text-zinc-900 dark:text-zinc-100">
                        {invoice.notes}
                      </p>
                    </div>
                  )}
                  {invoice.attachments && invoice.attachments.length > 0 && (
                    <>
                      {invoice.notes && <Separator />}
                      <div>
                        <p className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                          Attachments
                        </p>
                        <div className="space-y-2">
                          {invoice.attachments.map((attachment, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                            >
                              <div className="flex items-center space-x-3">
                                <Paperclip className="h-4 w-4 text-zinc-400" />
                                <span className="text-sm text-zinc-900 dark:text-zinc-100">
                                  {attachment.split('/').pop()}
                                </span>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Relationships and Timeline */}
          <div className="space-y-6">
            {/* Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
                <CardDescription>Outstanding balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                            {invoice.status === InvoiceStatus.overdue && (
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
                            Paid on{' '}
                            {format(
                              invoice.paymentDate || new Date(),
                              'dd MMM yyyy'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Related Records */}
            <Card>
              <CardHeader>
                <CardTitle>Related Records</CardTitle>
                <CardDescription>Linked documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoice.projectId && (
                  <Link
                    href={`/users/dashboard/projects/${invoice.projectId}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                      <div className="flex items-center space-x-3">
                        <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <div>
                          <p className="text-sm font-medium">Project</p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            View project details
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}
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
                {!invoice.projectId &&
                  !invoice.purchaseOrderId &&
                  !invoice.vendorId && (
                    <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                      No related records
                    </p>
                  )}
              </CardContent>
            </Card>

            {/* Approval Information */}
            {invoice.approvedBy && invoice.approvedAt && (
              <Card>
                <CardHeader>
                  <CardTitle>Approval</CardTitle>
                  <CardDescription>Invoice approval status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Approved</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {format(invoice.approvedAt, 'dd MMM yyyy, hh:mm a')}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        By{' '}
                        <Link
                          href={`/users/dashboard/workforce/employees/${invoice.approvedBy}`}
                          className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {getUserName(invoice.approvedBy)}
                        </Link>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audit Information */}
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>Invoice history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Invoice Created</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {format(invoice.createdAt, 'dd MMM yyyy, hh:mm a')}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        By{' '}
                        <Link
                          href={`/users/dashboard/workforce/employees/${invoice.createdBy}`}
                          className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {getUserName(invoice.createdBy)}
                        </Link>
                      </p>
                    </div>
                  </div>
                  {invoice.createdAt.getTime() !==
                    invoice.updatedAt.getTime() && (
                    <>
                      <Separator />
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                          <Edit className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Last Updated</p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            {format(invoice.updatedAt, 'dd MMM yyyy, hh:mm a')}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
