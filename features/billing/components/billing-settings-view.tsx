'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  invalidateEntitlements,
  useBillingEvents,
  useBillingProvider,
  useCancelSubscription,
  useCreateSubscription,
  useCurrentSubscription,
  useMandate,
  usePublicPlans,
} from '@tornotron/echno-core/billing/hooks';
import { exceedsAfaCap, type BillingPeriod, type Plan } from '@tornotron/echno-core/billing/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { Button } from '@/components/shadcn/button';
import { toast } from '@/lib/styles/toast-styles';
import { formatDate } from '@/lib/utils/date-utils';
import { useCheckout, type UseCheckoutOptions } from '../hooks/use-checkout';
import { BILLING_ADMIN_ONLY_MESSAGE, isForbiddenError } from '../lib/billing-messages';
import { BillingEventsList } from './billing-events-list';
import { MandateTerms } from './mandate-terms';
import { PlanPicker } from './plan-picker';
import { SubscriptionStatusCard, describeSubscription } from './subscription-status-card';

/** Polls the projection while a verified checkout waits for the webhook to activate it. */
const PENDING_POLL_MS = 5000;

export function BillingSettingsView({ checkout }: { checkout?: UseCheckoutOptions } = {}) {
  const searchParams = useSearchParams();
  const highlightFeature = searchParams?.get('feature') ?? null;
  const queryClient = useQueryClient();

  const provider = useBillingProvider();
  const plans = usePublicPlans();
  const flow = useCheckout(checkout);
  const awaitingActivation = flow.step.kind === 'verified';
  const subscription = useCurrentSubscription({
    refetchInterval: awaitingActivation ? PENDING_POLL_MS : false,
  });
  const providerEnabled = provider.data?.enabled === true;
  const mandate = useMandate({ enabled: providerEnabled });
  const events = useBillingEvents({ enabled: providerEnabled });
  const createFree = useCreateSubscription();
  const cancel = useCancelSubscription();

  // The pending row is the one whose plan code matches the checkout. On an
  // upgrade `GET /current` keeps answering with the organization's existing
  // ACTIVE row until the new one activates, so the status alone says nothing;
  // an old row on another plan is skipped and the poll continues (#453).
  const pendingPlan = flow.step.kind === 'verified' ? flow.step.plan : null;
  const projected = subscription.data;
  const projectedStatus = projected?.plan?.code === pendingPlan?.code ? projected?.status : undefined;
  const { reset: resetFlow, activationFailed } = flow;
  useEffect(() => {
    if (!awaitingActivation || !pendingPlan || !projectedStatus) return;
    if (projectedStatus === 'INCOMPLETE') return;
    if (projectedStatus === 'ACTIVE' || projectedStatus === 'TRIALING') {
      resetFlow();
      void invalidateEntitlements(queryClient);
      toast.success('Your plan is active.');
      return;
    }
    // INCOMPLETE_EXPIRED, UNPAID, CANCELED and the rest: the activation is over
    // and it did not succeed. Stop polling and say so instead of waiting forever.
    activationFailed(projectedStatus, describeSubscription(projected ?? null).message);
  }, [awaitingActivation, pendingPlan, projected, projectedStatus, resetFlow, activationFailed, queryClient]);

  const onSelect = (plan: Plan, period: BillingPeriod) => {
    const free = plan.monthlyPrice === 0 && plan.annualPrice === 0;
    if (free) {
      createFree.mutate(
        { planCode: plan.code, billingPeriod: period },
        {
          onSuccess: () => toast.success(`Switched to ${plan.name}.`),
          onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not switch plan'),
        }
      );
      return;
    }
    // A cycle above the auto-debit cap needs the per-charge approval flag on
    // the session or the backend refuses it; the mandate step still shows the
    // clause and takes the buyer's consent before any payment opens (#452).
    void flow.start(plan, period, exceedsAfaCap(plan, period, provider.data?.afaCapPaise));
  };

  const step = flow.step;

  if (subscription.isError && isForbiddenError(subscription.error)) {
    return (
      <Alert data-testid="billing-admin-only">
        <AlertTitle>Billing</AlertTitle>
        <AlertDescription>{BILLING_ADMIN_ONLY_MESSAGE}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <SubscriptionStatusCard
        subscription={subscription.data ?? null}
        isLoading={subscription.isLoading}
        onCancel={() =>
          cancel.mutate(
            { immediate: false },
            {
              onSuccess: () => toast.success('Cancellation scheduled for the end of the current period.'),
              onError: (error) =>
                toast.error(error instanceof Error ? error.message : 'Could not cancel the subscription'),
            }
          )
        }
        cancelling={cancel.isPending}
      />

      {mandate.data && (
        <Alert data-testid="mandate-summary">
          <AlertTitle>Automatic payments</AlertTitle>
          <AlertDescription>
            {mandate.data.method === 'UNKNOWN' ? 'Mandate' : mandate.data.method.replace('_', ' ')}{' '}
            {mandate.data.status.toLowerCase()}
            {mandate.data.authorizedAt ? `, authorized on ${formatDate(mandate.data.authorizedAt)}` : ''}.
          </AlertDescription>
        </Alert>
      )}

      {step.kind === 'verified' && (
        <Alert data-testid="checkout-pending">
          <AlertTitle>Authorization pending</AlertTitle>
          <AlertDescription>
            Your payment was received and is being confirmed with the provider. {step.plan.name} activates
            as soon as the confirmation arrives; this page updates on its own.
          </AlertDescription>
        </Alert>
      )}
      {step.kind === 'activation-failed' && (
        <Alert variant="destructive" data-testid="activation-failed">
          <AlertTitle>Activation did not complete</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            {step.plan.name} was not activated ({step.status.toLowerCase().replaceAll('_', ' ')}).{' '}
            {step.message}
            <Button size="sm" variant="outline" onClick={flow.reset}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {step.kind === 'verifying' && (
        <Alert>
          <AlertTitle>Verifying payment</AlertTitle>
          <AlertDescription>Confirming the payment with the server.</AlertDescription>
        </Alert>
      )}
      {step.kind === 'dismissed' && (
        <Alert>
          <AlertTitle>Checkout closed</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            No payment was made.
            <Button size="sm" variant="outline" onClick={() => flow.acceptMandate()}>
              Reopen payment
            </Button>
            <Button size="sm" variant="ghost" onClick={flow.reset}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {step.kind === 'error' && (
        <Alert variant="destructive" data-testid="checkout-error">
          <AlertTitle>Checkout did not complete</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            {step.message}
            <Button size="sm" variant="outline" onClick={flow.reset}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {plans.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Plans unavailable</AlertTitle>
          <AlertDescription>The plan catalog could not be loaded. Try again later.</AlertDescription>
        </Alert>
      ) : (
        <PlanPicker
          plans={plans.data ?? []}
          current={subscription.data ?? null}
          provider={provider.data}
          highlightFeature={highlightFeature}
          onSelect={onSelect}
          busy={flow.isBusy || createFree.isPending || provider.isLoading}
        />
      )}

      {step.kind === 'mandate' && (
        <MandateTerms
          plan={step.plan}
          session={step.session}
          onAccept={() => void flow.acceptMandate()}
          onCancel={flow.reset}
        />
      )}

      <BillingEventsList
        events={events.data}
        isLoading={providerEnabled && events.isLoading}
        unavailable={!providerEnabled || events.isError}
      />
    </div>
  );
}
