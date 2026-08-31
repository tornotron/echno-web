'use client';

/**
 * Who raised a payment voucher, who verified it, and why it was voided.
 *
 * Three separate facts about a voucher, deliberately not nested inside one
 * another. The raiser in particular is recorded from the moment the voucher
 * exists, so it renders on its own condition rather than under the verification
 * stamp: hanging it off the stamp would show it only once somebody had already
 * verified, which is exactly when it is least needed. Before that it answers
 * the question the verify action turns on, since the backend refuses a
 * verification from the account that raised the voucher.
 *
 * The cancellation card sits beside the verification one rather than replacing
 * it. The stamp survives a cancellation on purpose (echno-backend#636 voids the
 * document rather than retracting the check), so a voucher can be both verified
 * and cancelled, and that pair reads as "checked, then thrown out".
 */

import Link from 'next/link';
import { Ban, CheckCircle, UserPen } from 'lucide-react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { routes } from '@/nav';
import { userFilterHref } from '@/hooks/use-employee-filter';
import { userStampLabel } from '@/lib/utils/user-reference';
import {
  isPaymentCancelled,
  isPaymentVerified,
  type PaymentLifecycleState,
} from '@/lib/utils/payment-lifecycle';

/** The stamps and the voided-reason a voucher carries. */
export interface PaymentAttributionState extends PaymentLifecycleState {
  /** User who raised the voucher. */
  raisedBy?: number;
  /** Name the backend resolved for {@link raisedBy}. */
  raisedByName?: string;
  /** Name the backend resolved for the verifier. */
  verifiedByName?: string;
  /** Why the voucher was voided, on a cancelled one. */
  cancellationReason?: string;
}

export function PaymentAttribution({
  payment,
}: {
  payment: PaymentAttributionState;
}) {
  return (
    <>
      {payment.raisedBy != null && (
        <Card>
          <CardHeader>
            <CardTitle>Raised by</CardTitle>
            <CardDescription>Who created this voucher</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <UserPen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {userStampLabel(payment.raisedByName, payment.raisedBy)}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  A voucher cannot be verified by the account that raised it.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isPaymentVerified(payment) && (
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
                    only where it did not. `verifiedByName` was on the DTO all
                    along and the core schema was stripping it, which is why
                    this line used to read `User #7`. The id still makes the
                    filter link.
                  */}
                  <Link
                    href={userFilterHref(
                      routes.finance.payments.href,
                      payment.verifiedBy,
                      'verifier'
                    )}
                    className="text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {userStampLabel(payment.verifiedByName, payment.verifiedBy)}
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
    </>
  );
}
