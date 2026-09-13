'use client';

import type { Subscription } from '@tornotron/echno-core/billing/types';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { formatDate } from '@/lib/utils/date-utils';
import { formatRupees } from '../lib/money';

/** The copy each subscription state shows. Past due carries the grace message (spec section 7). */
export function describeSubscription(subscription: Subscription | null): {
  label: string;
  tone: 'default' | 'secondary' | 'destructive' | 'outline';
  message: string;
} {
  if (!subscription) {
    return {
      label: 'No plan',
      tone: 'outline',
      message: 'Your organization has no subscription yet. Pick a plan below to get started.',
    };
  }
  const periodEnd = subscription.currentPeriodEnd
    ? formatDate(subscription.currentPeriodEnd)
    : null;
  switch (subscription.status) {
    case 'TRIALING': {
      return {
        label: 'Trial',
        tone: 'secondary',
        message: subscription.trialEnd
          ? `Your trial ends on ${formatDate(subscription.trialEnd)}. Choose a plan before then to keep access.`
          : 'Your organization is on a trial.',
      };
    }
    case 'ACTIVE': {
      return {
        label: 'Active',
        tone: 'default',
        message: subscription.cancelAtPeriodEnd
          ? `Cancellation is scheduled; access continues until ${periodEnd ?? 'the end of the current period'}.`
          : periodEnd
            ? `Renews on ${periodEnd}. You will be notified at least 24 hours before each charge.`
            : 'Your subscription is active.',
      };
    }
    case 'PAST_DUE': {
      return {
        label: 'Payment overdue',
        tone: 'destructive',
        message:
          'The last payment did not go through. Access continues during a short grace period while the payment is retried; update the payment method or the subscription will be suspended.',
      };
    }
    case 'UNPAID': {
      return {
        label: 'Suspended',
        tone: 'destructive',
        message: 'Payment retries were exhausted and access is suspended. Start a new checkout to restore it.',
      };
    }
    case 'PAUSED': {
      return { label: 'Paused', tone: 'secondary', message: 'The subscription is paused.' };
    }
    case 'CANCELED': {
      return {
        label: 'Cancelled',
        tone: 'outline',
        message: periodEnd
          ? `Cancelled. Access ended or ends on ${periodEnd}.`
          : 'The subscription was cancelled.',
      };
    }
    case 'INCOMPLETE': {
      return {
        label: 'Authorization pending',
        tone: 'secondary',
        message:
          'The payment authorization is being confirmed with the provider. This usually takes a minute; the plan activates once it is confirmed.',
      };
    }
    case 'INCOMPLETE_EXPIRED': {
      return {
        label: 'Authorization expired',
        tone: 'outline',
        message: 'The payment authorization was not completed in time. Start the checkout again.',
      };
    }
    default: {
      return { label: 'Expired', tone: 'outline', message: 'The subscription has expired.' };
    }
  }
}

interface SubscriptionStatusCardProps {
  subscription: Subscription | null;
  isLoading?: boolean;
  onCancel?: () => void;
  cancelling?: boolean;
}

export function SubscriptionStatusCard({
  subscription,
  isLoading,
  onCancel,
  cancelling,
}: SubscriptionStatusCardProps) {
  const { label, tone, message } = describeSubscription(subscription);
  const plan = subscription?.plan ?? null;
  const canCancel =
    !!onCancel &&
    !!subscription &&
    !subscription.cancelAtPeriodEnd &&
    (subscription.status === 'ACTIVE' ||
      subscription.status === 'TRIALING' ||
      subscription.status === 'PAST_DUE');

  return (
    <Card data-testid="subscription-status">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Current plan</CardTitle>
          <Badge variant={tone} data-testid="subscription-status-badge">
            {isLoading ? 'Loading' : label}
          </Badge>
        </div>
        <CardDescription>
          {plan ? (
            <span>
              <span className="font-medium text-foreground">{plan.name}</span>
              {plan.monthlyPrice > 0 && <span>, {formatRupees(plan.monthlyPrice)} per month</span>}
            </span>
          ) : (
            'No plan selected'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{isLoading ? 'Checking your subscription' : message}</p>
        {subscription?.provider === 'RAZORPAY' && subscription.nextChargeAt && (
          <p className="text-sm">Next charge: {formatDate(subscription.nextChargeAt)}</p>
        )}
        {canCancel && (
          <Button variant="outline" size="sm" onClick={onCancel} disabled={cancelling}>
            {cancelling ? 'Cancelling' : 'Cancel at period end'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
