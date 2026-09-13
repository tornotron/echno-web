/**
 * The checkout flow (#448) against a fake Razorpay handler: starting a
 * checkout requests a session from the backend, the mandate step gates a
 * recurring plan, Checkout.js is opened with the ids the backend returned,
 * and its success callback goes to the verify endpoint. The flow never
 * reports the plan active on the client's own say-so.
 */
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import * as realBillingServices from '@tornotron/echno-core/billing/services';
import { parsePlan } from '@tornotron/echno-core/billing/types';
import type { RazorpayOptions } from '../lib/razorpay-checkout';

const createCheckoutSession = mock(async (req: { planCode: string; billingPeriod: string }) => ({
  provider: 'RAZORPAY',
  keyId: 'rzp_test_abc',
  providerSubscriptionId: req.planCode === 'ONEOFF' ? null : 'sub_123',
  providerOrderId: req.planCode === 'ONEOFF' ? 'order_1' : null,
  planCode: req.planCode,
  billingPeriod: req.billingPeriod,
  amountPaise: 999_900,
  currency: 'INR',
  recurring: req.planCode !== 'ONEOFF',
  mandate: { amountCapPaise: 999_900, method: 'UPI_AUTOPAY' },
}));
const verifyCheckout = mock(async () => ({ id: 7, status: 'INCOMPLETE' }));

mock.module('@tornotron/echno-core/billing/services', () => ({
  ...realBillingServices,
  billingService: {
    ...realBillingServices.billingService,
    createCheckoutSession,
    verifyCheckout,
  },
}));

const { useCheckout } = await import('./use-checkout');

const plan = parsePlan({ id: 3, code: 'PRO', name: 'Professional Plan', monthlyPrice: 9999 });

let opened: RazorpayOptions[] = [];
function fakeRazorpay(options: RazorpayOptions) {
  opened.push(options);
  return { open: () => {} };
}
const fakeFactory = async () => fakeRazorpay;

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  opened = [];
  createCheckoutSession.mockClear();
  verifyCheckout.mockClear();
});
afterEach(() => cleanup());

describe('useCheckout', () => {
  test('requests a session, stops at the mandate step for a recurring plan, then opens Checkout.js with the backend ids', async () => {
    const { result } = renderHook(() => useCheckout({ razorpayFactory: fakeFactory }), { wrapper });
    await act(() => result.current.start(plan, 'MONTHLY'));
    expect(createCheckoutSession).toHaveBeenCalledWith({
      planCode: 'PRO',
      billingPeriod: 'MONTHLY',
      acceptPerChargeAfa: false,
    });
    expect(result.current.step.kind).toBe('mandate');
    expect(opened).toHaveLength(0);

    await act(() => result.current.acceptMandate());
    expect(opened).toHaveLength(1);
    expect(opened[0].key).toBe('rzp_test_abc');
    expect(opened[0].subscription_id).toBe('sub_123');
    expect(opened[0].order_id).toBeUndefined();
    expect(result.current.step.kind).toBe('paying');
  });

  test('a one-off session skips the mandate step and passes the order id', async () => {
    const oneOff = parsePlan({ id: 9, code: 'ONEOFF', name: 'One-off', monthlyPrice: 100 });
    const { result } = renderHook(() => useCheckout({ razorpayFactory: fakeFactory }), { wrapper });
    await act(() => result.current.start(oneOff, 'MONTHLY'));
    expect(opened[0].order_id).toBe('order_1');
    expect(opened[0].subscription_id).toBeUndefined();
    expect(result.current.step.kind).toBe('paying');
  });

  test('Checkout.js success calls verify with the provider payload and ends in verified, never active', async () => {
    const { result } = renderHook(() => useCheckout({ razorpayFactory: fakeFactory }), { wrapper });
    await act(() => result.current.start(plan, 'MONTHLY'));
    await act(() => result.current.acceptMandate());
    act(() =>
      opened[0].handler({
        razorpay_payment_id: 'pay_1',
        razorpay_signature: 'sig',
        razorpay_subscription_id: 'sub_123',
      })
    );
    await waitFor(() => expect(result.current.step.kind).toBe('verified'));
    expect(verifyCheckout).toHaveBeenCalledWith({
      providerPaymentId: 'pay_1',
      providerSignature: 'sig',
      providerSubscriptionId: 'sub_123',
      providerOrderId: undefined,
    });
  });

  test('a failed verification is an error, not a success', async () => {
    verifyCheckout.mockRejectedValueOnce(new Error('Signature mismatch'));
    const { result } = renderHook(() => useCheckout({ razorpayFactory: fakeFactory }), { wrapper });
    await act(() => result.current.start(plan, 'MONTHLY'));
    await act(() => result.current.acceptMandate());
    act(() => opened[0].handler({ razorpay_payment_id: 'pay_1', razorpay_signature: 'bad' }));
    await waitFor(() => expect(result.current.step.kind).toBe('error'));
    expect(result.current.step.kind === 'error' && result.current.step.message).toBe('Signature mismatch');
  });

  test('a session the backend refuses ends in error and never opens Checkout.js', async () => {
    createCheckoutSession.mockRejectedValueOnce(new Error('Billing not configured'));
    const { result } = renderHook(() => useCheckout({ razorpayFactory: fakeFactory }), { wrapper });
    await act(() => result.current.start(plan, 'MONTHLY'));
    expect(result.current.step.kind).toBe('error');
    expect(opened).toHaveLength(0);
  });
});
