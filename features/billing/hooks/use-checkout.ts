'use client';

/**
 * The checkout state machine (spec section 9.2): pick a plan, read the
 * mandate terms when the plan is recurring, open Razorpay Checkout.js with
 * the ids the backend issued, send the success payload back for
 * verification, then wait for the webhook-driven projection to report the
 * subscription active. The client never grants anything on its own: a
 * success from Checkout.js only moves the flow to `verifying`, and
 * `verified` still shows "authorization pending" until the backend row says
 * `ACTIVE`.
 */
import { useCallback, useState } from 'react';
import {
  useCreateCheckoutSession,
  useVerifyCheckout,
} from '@tornotron/echno-core/billing/hooks';
import type {
  BillingPeriod,
  CheckoutSession,
  Plan,
} from '@tornotron/echno-core/billing/types';
import {
  browserRazorpayFactory,
  checkoutOptionsFor,
  type RazorpayFactory,
  type RazorpaySuccessResponse,
} from '../lib/razorpay-checkout';

export type CheckoutStep =
  | { kind: 'idle' }
  | { kind: 'creating'; plan: Plan; period: BillingPeriod }
  | { kind: 'mandate'; plan: Plan; period: BillingPeriod; session: CheckoutSession }
  | { kind: 'paying'; plan: Plan; period: BillingPeriod; session: CheckoutSession }
  | { kind: 'verifying'; plan: Plan; session: CheckoutSession }
  | { kind: 'verified'; plan: Plan }
  | { kind: 'dismissed'; plan: Plan; period: BillingPeriod; session: CheckoutSession }
  | { kind: 'error'; plan: Plan | null; message: string };

export interface UseCheckoutOptions {
  /** Test seam: resolves to the factory that builds a Checkout.js instance. */
  razorpayFactory?: () => Promise<RazorpayFactory>;
}

export interface UseCheckoutResult {
  step: CheckoutStep;
  /** Asks the backend for a session; recurring plans stop at the mandate step first. */
  start: (plan: Plan, period: BillingPeriod, acceptPerChargeAfa?: boolean) => Promise<void>;
  /** The buyer accepted the mandate terms; opens Checkout.js. */
  acceptMandate: () => Promise<void>;
  reset: () => void;
  isBusy: boolean;
}

export function useCheckout(options: UseCheckoutOptions = {}): UseCheckoutResult {
  const [step, setStep] = useState<CheckoutStep>({ kind: 'idle' });
  const createSession = useCreateCheckoutSession();
  const verify = useVerifyCheckout();
  const factoryProvider = options.razorpayFactory ?? browserRazorpayFactory;

  const openCheckout = useCallback(
    async (plan: Plan, period: BillingPeriod, session: CheckoutSession) => {
      setStep({ kind: 'paying', plan, period, session });
      let factory: RazorpayFactory;
      try {
        factory = await factoryProvider();
      } catch (error) {
        setStep({
          kind: 'error',
          plan,
          message: error instanceof Error ? error.message : 'Payment page could not be loaded',
        });
        return;
      }
      const handler = (response: RazorpaySuccessResponse) => {
        setStep({ kind: 'verifying', plan, session });
        verify.mutate(
          {
            providerPaymentId: response.razorpay_payment_id,
            providerSignature: response.razorpay_signature,
            providerSubscriptionId: response.razorpay_subscription_id ?? undefined,
            providerOrderId: response.razorpay_order_id ?? undefined,
          },
          {
            onSuccess: () => setStep({ kind: 'verified', plan }),
            onError: (error) =>
              setStep({
                kind: 'error',
                plan,
                message:
                  error instanceof Error
                    ? error.message
                    : 'The payment could not be verified. No charge is applied until it is.',
              }),
          }
        );
      };
      const instance = factory(
        checkoutOptionsFor(session, plan.name, handler, () =>
          setStep((current) =>
            current.kind === 'paying' ? { kind: 'dismissed', plan, period, session } : current
          )
        )
      );
      instance.on?.('payment.failed', () =>
        setStep({
          kind: 'error',
          plan,
          message: 'The payment was declined. Nothing has been charged; you can try again.',
        })
      );
      instance.open();
    },
    [factoryProvider, verify]
  );

  const start = useCallback(
    async (plan: Plan, period: BillingPeriod, acceptPerChargeAfa = false) => {
      setStep({ kind: 'creating', plan, period });
      try {
        const session = await createSession.mutateAsync({
          planCode: plan.code,
          billingPeriod: period,
          acceptPerChargeAfa,
        });
        if (session.recurring) {
          setStep({ kind: 'mandate', plan, period, session });
        } else {
          await openCheckout(plan, period, session);
        }
      } catch (error) {
        setStep({
          kind: 'error',
          plan,
          message:
            error instanceof Error ? error.message : 'Checkout could not be started. Try again.',
        });
      }
    },
    [createSession, openCheckout]
  );

  const acceptMandate = useCallback(async () => {
    if (step.kind !== 'mandate') return;
    await openCheckout(step.plan, step.period, step.session);
  }, [openCheckout, step]);

  const reset = useCallback(() => setStep({ kind: 'idle' }), []);

  return {
    step,
    start,
    acceptMandate,
    reset,
    isBusy: step.kind === 'creating' || step.kind === 'paying' || step.kind === 'verifying',
  };
}
