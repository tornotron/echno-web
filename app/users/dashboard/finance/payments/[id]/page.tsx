'use client';

import { use } from 'react';
import { usePaymentById } from '@/hooks/payments';
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
  CreditCard,
  Edit,
  Download,
  Calendar,
  Building,
  FileText,
  Hash,
  CheckCircle,
  User,
  Briefcase,
  Loader2,
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
import { userFilterHref } from '@/hooks/use-employee-filter';
import { userReferenceLabel } from '@/lib/utils/user-reference';
import { format } from 'date-fns';
import {
  paymentTypeLabels,
  paymentStatusLabels,
  paymentMethodLabels,
  getPaymentStatusColor,
  getPaymentTypeColor,
} from '@/types/finance/payment';

interface PaymentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { data: payment, isLoading, isError } = usePaymentById(id);

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
          <CreditCard className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Failed to load payment</EmptyTitle>
          <EmptyDescription>
            An unexpected error occurred. Please try again.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.finance.payments.href}>Back to Payments</Link>
        </Button>
      </Empty>
    );
  if (!payment)
    return (
      <Empty variant="default">
        <EmptyErrorMedia>
          <CreditCard className="size-6" />
        </EmptyErrorMedia>
        <EmptyHeader>
          <EmptyTitle>Payment not found</EmptyTitle>
          <EmptyDescription>
            This record may have been deleted or does not exist.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={routes.finance.payments.href}>Back to Payments</Link>
        </Button>
      </Empty>
    );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={payment.paymentNumber}
        description={payment.description}
        actions={
          <>
            <Badge className={getPaymentStatusColor(payment.status)}>
              {paymentStatusLabels[payment.status]}
            </Badge>
            <Badge className={getPaymentTypeColor(payment.type)}>
              {paymentTypeLabels[payment.type]}
            </Badge>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button asChild>
              <Link href={routes.finance.payments.detail(payment.id).edit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </>
        }
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Payment Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Amount Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Amount</CardTitle>
              <CardDescription>Transaction amount details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-zinc-50 p-6 dark:bg-zinc-800/50">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Payment Amount
                    </span>
                    <span className="font-medium">
                      ₹{payment.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      ₹{payment.amount.toLocaleString('en-IN')}{' '}
                      {payment.currency}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Information */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Information</CardTitle>
              <CardDescription>Payment and transaction details</CardDescription>
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
                    {paymentMethodLabels[payment.method]}
                  </p>
                </div>
              </div>
              <Separator />
              {payment.transactionId && (
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
                        {payment.transactionId}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              {payment.referenceNumber && (
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
                        {payment.referenceNumber}
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
                    Payment Date
                  </p>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {payment.paymentDate
                      ? format(payment.paymentDate, 'dd MMM yyyy, hh:mm a')
                      : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Information */}
          {(payment.bankName || payment.accountNumber || payment.ifscCode) && (
            <Card>
              <CardHeader>
                <CardTitle>Bank Information</CardTitle>
                <CardDescription>Banking details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {payment.bankName && (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                        <Building className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Bank Name
                        </p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {payment.bankName}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                {payment.accountNumber && (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/20">
                        <Hash className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Account Number
                        </p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {payment.accountNumber}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                {payment.ifscCode && (
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/20">
                      <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        IFSC Code
                      </p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {payment.ifscCode}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {payment.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Notes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Notes
                  </p>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {payment.notes}
                  </p>
                </div>
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
              {payment.invoiceId && (
                <Link
                  href={routes.finance.invoices.detail(payment.invoiceId).href}
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
              {payment.projectId && (
                <Link
                  href={
                    routes.projects.allProjects.detail(
                      payment.projectId
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
              {payment.vendorId && (
                <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="text-sm font-medium">Vendor</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Vendor ID: {payment.vendorId}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {payment.employeeId && (
                <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium">Employee</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Employee ID: {payment.employeeId}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {!payment.invoiceId &&
                !payment.projectId &&
                !payment.vendorId &&
                !payment.employeeId && (
                  <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                    No related records
                  </p>
                )}
            </CardContent>
          </Card>

          {/* Verification Information */}
          {payment.verifiedBy && payment.verifiedAt && (
            <Card>
              <CardHeader>
                <CardTitle>Verification</CardTitle>
                <CardDescription>Payment verification status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Verified</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {format(payment.verifiedAt, 'dd MMM yyyy, hh:mm a')}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      By{' '}
                      <Link
                        href={userFilterHref(
                          routes.finance.payments.href,
                          payment.verifiedBy,
                          'verifier'
                        )}
                        className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {userReferenceLabel(payment.verifiedBy)}
                      </Link>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
