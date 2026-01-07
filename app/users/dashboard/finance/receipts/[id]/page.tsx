'use client';

import { notFound } from 'next/navigation';
import { use } from 'react';
import { mockReceipts } from '@/components/shared/mock-data';
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
  Receipt as ReceiptIcon,
  Edit,
  Download,
  DollarSign,
  Calendar,
  CreditCard,
  User,
  Building,
  FileText,
  MapPin,
  Hash,
  CheckCircle,
  Paperclip,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ReceiptType,
  ReceiptStatus,
  receiptTypeLabels,
  receiptStatusLabels,
} from '@/types/finance/receipt';

interface ReceiptDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

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

export default function ReceiptDetailPage({ params }: ReceiptDetailPageProps) {
  const resolvedParams = use(params);
  const receipt = mockReceipts.find(
    (r) => r.id === Number.parseInt(resolvedParams.id)
  );

  if (!receipt) {
    notFound();
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-green-500 to-green-600">
              <ReceiptIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="mb-2 flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {receipt.receiptNumber}
                </h1>
                <Badge className={getStatusColor(receipt.status)}>
                  {receiptStatusLabels[receipt.status]}
                </Badge>
                <Badge className={getTypeColor(receipt.type)}>
                  {receiptTypeLabels[receipt.type]}
                </Badge>
              </div>
              <p className="mb-2 text-zinc-600 dark:text-zinc-400">
                {receipt.description}
              </p>
              <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Calendar className="h-4 w-4" />
                <span>Issued on {format(receipt.issuedAt, 'dd MMM yyyy')}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Link href={`/users/dashboard/finance/receipts/${receipt.id}/edit`}>
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
        {/* Left Column - Receipt Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Amount Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Amount Details</CardTitle>
              <CardDescription>Receipt amount breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-zinc-50 p-6 dark:bg-zinc-800/50">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Receipt Amount
                    </span>
                    <span className="font-medium">
                      ₹{receipt.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {receipt.taxAmount && (
                    <>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {receipt.taxType || 'Tax'} ({receipt.taxRate}%)
                        </span>
                        <span className="font-medium">
                          ₹{receipt.taxAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      ₹{receipt.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>Transaction details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Payment Method
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {receipt.paymentMethod}
                  </p>
                </div>
              </div>
              <Separator />
              {receipt.transactionId && (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      <Hash className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Transaction ID
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {receipt.transactionId}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              {receipt.referenceNumber && (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
                      <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Reference Number
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {receipt.referenceNumber}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Receipt Date
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {format(receipt.receiptDate, 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Received From */}
          <Card>
            <CardHeader>
              <CardTitle>Received From</CardTitle>
              <CardDescription>Customer information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                  <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Name
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {receipt.receivedFrom}
                  </p>
                </div>
              </div>
              {receipt.receivedFromAddress && (
                <>
                  <Separator />
                  <div className="flex items-start space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/20">
                      <MapPin className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Address
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {receipt.receivedFromAddress}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes and Attachments */}
          {(receipt.notes ||
            (receipt.attachments && receipt.attachments.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Notes and attachments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {receipt.notes && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Notes
                    </p>
                    <p className="text-zinc-900 dark:text-zinc-100">
                      {receipt.notes}
                    </p>
                  </div>
                )}
                {receipt.attachments && receipt.attachments.length > 0 && (
                  <>
                    {receipt.notes && <Separator />}
                    <div>
                      <p className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        Attachments
                      </p>
                      <div className="space-y-2">
                        {receipt.attachments.map((attachment, index) => (
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
          {/* Related Records */}
          <Card>
            <CardHeader>
              <CardTitle>Related Records</CardTitle>
              <CardDescription>Linked documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {receipt.invoiceId && (
                <Link
                  href={`/users/dashboard/finance/invoices/${receipt.invoiceId}`}
                  className="block"
                >
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm font-medium">Invoice</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          View invoice details
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
              {receipt.paymentId && (
                <Link
                  href={`/users/dashboard/finance/payments/${receipt.paymentId}`}
                  className="block"
                >
                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm font-medium">Payment</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          View payment details
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
              {receipt.projectId && (
                <Link
                  href={`/users/dashboard/projects/${receipt.projectId}`}
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
              {!receipt.invoiceId &&
                !receipt.paymentId &&
                !receipt.projectId && (
                  <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                    No related records
                  </p>
                )}
            </CardContent>
          </Card>

          {/* Audit Information */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Receipt history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Receipt Issued</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {format(receipt.issuedAt, 'dd MMM yyyy, hh:mm a')}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      By User #{receipt.issuedBy}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Receipt Created</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {format(receipt.createdAt, 'dd MMM yyyy, hh:mm a')}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      By User #{receipt.createdBy}
                    </p>
                  </div>
                </div>
                {receipt.createdAt.getTime() !==
                  receipt.updatedAt.getTime() && (
                  <>
                    <Separator />
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
                        <Edit className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {format(receipt.updatedAt, 'dd MMM yyyy, hh:mm a')}
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
  );
}
