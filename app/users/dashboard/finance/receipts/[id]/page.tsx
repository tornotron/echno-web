'use client';

import { routes } from '@/nav';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReceiptById, useDeleteReceipt } from '@/hooks/receipts';
import { getErrorMessage } from '@tornotron/echno-core';
import { toast } from '@/lib/styles/toast-styles';
import { Button } from '@/components/shadcn/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/shadcn/alert-dialog';
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
  Loader2,
  Trash2,
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
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { employeeFilterHref } from '@/hooks/use-employee-filter';
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
  const id = Number.parseInt(resolvedParams.id);
  const router = useRouter();
  const { data: receipt, isLoading, isError } = useReceiptById(id);
  const { data: employees = [] } = useEmployeeLookup();
  const deleteReceipt = useDeleteReceipt();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  async function handleDelete() {
    try {
      await deleteReceipt.mutateAsync(id);
      toast.success('Receipt deleted');
      setConfirmDeleteOpen(false);
      router.push(routes.finance.receipts.href);
    } catch (error) {
      toast.error('Failed to delete receipt', {
        description: getErrorMessage(error),
      });
    }
  }

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
          <ReceiptIcon className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Failed to load receipt</EmptyTitle>
          <EmptyDescription>
            An unexpected error occurred. Please try again.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.finance.receipts.href}>Back to Receipts</Link>
        </Button>
      </Empty>
    );
  if (!receipt)
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <ReceiptIcon className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Receipt not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or does not exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.finance.receipts.href}>Back to Receipts</Link>
        </Button>
      </Empty>
    );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={receipt.receiptNumber}
        description={receipt.description}
        actions={
          <>
            <Badge className={getStatusColor(receipt.status)}>
              {receiptStatusLabels[receipt.status]}
            </Badge>
            <Badge className={getTypeColor(receipt.type)}>
              {receiptTypeLabels[receipt.type]}
            </Badge>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button asChild>
              <Link href={routes.finance.receipts.detail(receipt.id).edit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => setConfirmDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </>
        }
      />

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {receipt.receiptNumber}. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteReceipt.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteReceipt.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteReceipt.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  href={routes.finance.invoices.detail(receipt.invoiceId).href}
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
                  href={routes.finance.payments.detail(receipt.paymentId).href}
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
                  href={
                    routes.projects.allProjects.detail(
                      receipt.projectId
                    ).href
                  }
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
                      By{' '}
                      {receipt.issuedBy ? (
                        <Link
                          href={employeeFilterHref(
                            routes.finance.receipts.href,
                            receipt.issuedBy,
                            'issuer'
                          )}
                          className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {getEmployeeName(receipt.issuedBy)}
                        </Link>
                      ) : (
                        getEmployeeName(receipt.issuedBy)
                      )}
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
                      By{' '}
                      {receipt.createdBy ? (
                        <Link
                          href={employeeFilterHref(
                            routes.finance.receipts.href,
                            receipt.createdBy,
                            'creator'
                          )}
                          className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {getEmployeeName(receipt.createdBy)}
                        </Link>
                      ) : (
                        getEmployeeName(receipt.createdBy)
                      )}
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
