'use client';

import { useState } from 'react';
import type { CheckoutSession, Plan } from '@tornotron/echno-core/billing/types';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Label } from '@/components/shadcn/label';
import { formatPaise } from '../lib/money';

interface MandateTermsProps {
  plan: Plan;
  session: CheckoutSession;
  onAccept: () => void;
  onCancel: () => void;
}

/**
 * The e-mandate step before Checkout.js opens for a recurring plan (spec
 * section 7): the amount the mandate is registered for, the 24 hour
 * pre-debit notice, and per-charge approval when the cycle is above the
 * AFA cap. The buyer must tick the consent before the payment page opens.
 */
export function MandateTerms({ plan, session, onAccept, onCancel }: MandateTermsProps) {
  const [agreed, setAgreed] = useState(false);
  const terms = session.mandate;
  const cap = terms?.amountCapPaise ?? session.amountPaise;
  const noticeHours = terms?.preDebitNoticeHours ?? 24;
  const cycle = session.billingPeriod === 'ANNUAL' ? 'year' : 'month';

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent data-testid="mandate-terms">
        <DialogHeader>
          <DialogTitle>Set up automatic payments for {plan.name}</DialogTitle>
          <DialogDescription>
            You are registering a recurring payment instruction (e-mandate) with your bank or UPI app.
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>
            <span className="font-medium">{formatPaise(session.amountPaise)}</span> per {cycle}, debited
            automatically. The mandate is registered for up to{' '}
            <span className="font-medium">{formatPaise(cap)}</span> per debit.
          </li>
          <li>
            You will be notified at least {noticeHours} hours before each debit and can cancel before it is
            taken.
          </li>
          <li>The first authorization needs your bank or UPI approval (OTP, PIN or app approval).</li>
          {terms?.perChargeApproval ? (
            <li className="text-amber-700 dark:text-amber-400" data-testid="per-charge-approval">
              This amount is above the 15,000 rupee auto-debit limit, so every payment will ask for your
              approval.
            </li>
          ) : (
            <li>Payments at or below 15,000 rupees run without a per-payment OTP once authorized.</li>
          )}
          <li>The plan activates only after your bank confirms the authorization, usually within a minute.</li>
        </ul>
        <div className="flex items-start gap-2">
          <Checkbox
            id="mandate-consent"
            checked={agreed}
            onCheckedChange={(value) => setAgreed(value === true)}
          />
          <Label htmlFor="mandate-consent" className="text-sm leading-snug">
            I authorize recurring payments on these terms.
          </Label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Back
          </Button>
          <Button onClick={onAccept} disabled={!agreed} data-testid="mandate-continue">
            Continue to payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
