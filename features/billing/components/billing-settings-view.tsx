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
import type { BillingPeriod, Plan } from '@tornotron/echno-core/billing/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/shadcn/alert';
import { Button } from '@/components/shadcn/button';
import { toast } from '@/lib/styles/toast-styles';
import { formatDate } from '@/lib/utils/date-utils';
import { useCheckout, type UseCheckoutOptions } from '../hooks/use-checkout';
import { BillingEventsList } from './billing-events-list';
import { MandateTerms } from './mandate-terms';
import { PlanPicker } from './plan-picker';
import { SubscriptionStatusCard } from './subscription-status-card';

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

  useEffect(() => {
    if (awaitingActivation && subscription.data?.status === 'ACTIVE') {
      flow.reset();
      void invalidateEntitlements(queryClient);
      toast.success('Your plan is active.');
    }
  }, [awaitingActivation, subscription.data?.status, flow, queryClient]);

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
    void flow.start(plan, period);
  };

  const step = flow.step;

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
