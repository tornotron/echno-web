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
  Ban,
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
import { useEmployeeLookup } from '@tornotron/echno-core/employee/hooks';
import { userFilterHref } from '@/hooks/use-employee-filter';
import {
  employeeReferenceLabel,
  userStampLabel,
} from '@/lib/utils/user-reference';
import {
  canEditPayment,
  editRefusalReason,
  isPaymentCancelled,
} from '@/lib/utils/payment-lifecycle';
import { PaymentLifecycleActions } from '@/features/payments';
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
  const { data: employees = [] } = useEmployeeLookup();
  const payeeEmployee = employees.find((e) => e.id === payment?.employeeId);

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
            <PaymentLifecycleActions paymentId={payment.id} payment={payment} />
            {/*
              Edit is withdrawn rather than left to fail. echno-backend#636
              refuses the PUT on a verified voucher and on a cancelled one, so
              offering it here would load the form, take everything the user
              typed, and lose it on the save. The reason is said in its place,
              below the header, because a button that quietly disappears is its
              own kind of confusing.
            */}
            {canEditPayment(payment) && (
              <Button asChild>
                <Link href={routes.finance.payments.detail(payment.id).edit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}
          </>
        }
      />

      {!canEditPayment(payment) && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {editRefusalReason(payment)}
        </p>
      )}

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
                      {/*
                        Named rather than numbered, but deliberately not a link.
                        The id is a real employee id — the payee, set from the
                        creation payload beside vendorId, subContractId and
                        labourId and selected by payeeType — so the link itself
                        would be correct. The list it would open is not:
                        `GET /finance/construction-payments/web` returns a
                        Spring `Page` and this client sends no page size, so it
                        holds twenty vouchers. Filtering those would answer
                        "paid to X" with whatever happened to be on the first
                        page. Filed as echno-backend#638.
                      */}
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {payeeEmployee?.name ??
                          employeeReferenceLabel(payment.employeeId)}
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
                      {/*
                        The name where the backend resolved one, and the id form
                        only where it did not. `verifiedByName` was on the DTO
                        all along and the core schema was stripping it, which is
                        why this line used to read `User #7`. The id still makes
                        the filter link.
                      */}
                      <Link
                        href={userFilterHref(
                          routes.finance.payments.href,
                          payment.verifiedBy,
                          'verifier'
                        )}
                        className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {userStampLabel(
                          payment.verifiedByName,
                          payment.verifiedBy
                        )}
                      </Link>
                    </p>
                    {payment.raisedBy && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        {/*
                          The other half of the pair the backend's
                          segregation-of-duties check compares: it refuses a
                          verification from the account that raised the voucher.
                          Showing both is what makes that refusal legible.
                        */}
                        Raised by{' '}
                        {userStampLabel(payment.raisedByName, payment.raisedBy)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/*
            Shown alongside the verification card rather than instead of it. The
            stamp deliberately survives a cancellation, so a voucher can be both
            verified and voided, and that pair reads as "checked, then thrown
            out" rather than as a contradiction. The reason is the only record
            of why somebody's check was set aside.
          */}
          {isPaymentCancelled(payment) && (
            <Card>
              <CardHeader>
                <CardTitle>Cancellation</CardTitle>
                <CardDescription>Why this voucher was voided</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                    <Ban className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cancelled</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {payment.cancellationReason ?? 'No reason was recorded.'}
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
