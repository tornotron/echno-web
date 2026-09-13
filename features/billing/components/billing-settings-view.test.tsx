/**
 * The billing page as a whole, driven through a fake Checkout.js (#452, #453,
 * #456): an above-cap plan sends the per-charge approval flag on the session,
 * a verified checkout is only announced active once the projected row carries
 * the plan that was bought, a row that lands on a terminal non-active status
 * ends the pending state with a visible failure, and a member the backend
 * refuses sees the admin-only notice instead of a false "No plan" picker.
 *
 * Mocks sit at the core service layer, the same seam `use-checkout.test.tsx`
 * uses, so the real hooks and the real query cache run in between. The poll
 * is driven by invalidating the cache rather than waiting out the interval.
 */
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { ApiError } from '@tornotron/echno-core';
import * as realBillingServices from '@tornotron/echno-core/billing/services';
import { parsePlan, parseSubscription, type Subscription } from '@tornotron/echno-core/billing/types';
import * as realNavigation from 'next/navigation';
import type { RazorpayOptions } from '../lib/razorpay-checkout';
import { BILLING_ADMIN_ONLY_MESSAGE } from '../lib/billing-messages';

const plans = [
  { id: 1, code: 'FREE', name: 'Free Plan', monthlyPrice: 0, annualPrice: 0, sortOrder: 1, features: [] },
  { id: 2, code: 'STARTER', name: 'Starter Plan', monthlyPrice: 2999, annualPrice: 29_990, sortOrder: 2 },
  { id: 3, code: 'PRO', name: 'Professional Plan', monthlyPrice: 9999, annualPrice: 99_990, sortOrder: 3 },
  { id: 4, code: 'ENTERPRISE', name: 'Enterprise Plan', monthlyPrice: 24_999, annualPrice: 249_990, sortOrder: 4 },
].map((dto) => parsePlan(dto));

const provider = {
  provider: 'RAZORPAY' as const,
  enabled: true,
  keyId: 'rzp_test_abc',
  currency: 'INR',
  afaCapPaise: 1_500_000,
  preDebitNoticeHours: 24,
};

const row = (status: string, code: string, id = 1): Subscription =>
  parseSubscription({
    id,
    status,
    plan: plans.find((p) => p.code === code),
  });

/** What `GET /billing/subscriptions/web/current` answers on each successive read. */
let currentReads: (Subscription | null | Error)[] = [];
const getCurrentSubscription = mock(async () => {
  const next = currentReads.length > 1 ? currentReads.shift() : currentReads[0];
  if (next instanceof Error) throw next;
  return next ?? null;
});
const createCheckoutSession = mock(async (req: { planCode: string; billingPeriod: string }) => ({
  provider: 'RAZORPAY',
  keyId: 'rzp_test_abc',
  providerSubscriptionId: 'sub_123',
  providerOrderId: null,
  planCode: req.planCode,
  billingPeriod: req.billingPeriod,
  amountPaise: 999_900,
  currency: 'INR',
  recurring: true,
  mandate: { amountCapPaise: 999_900, method: 'UPI_AUTOPAY' },
}));
const verifyCheckout = mock(async () => row('INCOMPLETE', 'PRO', 2));
const createSubscription = mock(async () => row('ACTIVE', 'FREE', 3));

mock.module('@tornotron/echno-core/billing/services', () => ({
  ...realBillingServices,
  billingService: {
    ...realBillingServices.billingService,
    listPublicPlans: async () => plans,
    getProviderInfo: async () => provider,
    getMandate: async () => null,
    listBillingEvents: async () => [],
    getCurrentSubscription,
    createCheckoutSession,
    verifyCheckout,
    createSubscription,
  },
}));

mock.module('next/navigation', () => ({
  ...realNavigation,
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/users/dashboard/settings/billing',
  useRouter: () => ({ push: () => {}, replace: () => {} }),
}));

const toast = { success: mock((_message: string) => {}), error: mock((_message: string) => {}) };
mock.module('@/lib/styles/toast-styles', () => ({ toast }));

const { BillingSettingsView } = await import('./billing-settings-view');

/** Presence checks as booleans: printing a DOM element into a failure message hangs the reporter. */
const has = (view: ReturnType<typeof render>, testId: string) => view.queryByTestId(testId) !== null;
const inDocument = (selector: string) => document.querySelector(selector) !== null;
/** The machine is shared with other suites; give async settles room without slowing a pass. */
const SETTLE = { timeout: 5000 };

let opened: RazorpayOptions[] = [];
function fakeRazorpay(options: RazorpayOptions) {
  opened.push(options);
  return { open: () => {} };
}
const fakeFactory = async () => fakeRazorpay;

let queryClient: QueryClient;
function screen() {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return render(createElement(BillingSettingsView, { checkout: { razorpayFactory: fakeFactory } }), {
    wrapper,
  });
}

/** Re-runs the subscription read the way the pending poll would. */
async function poll() {
  await act(async () => {
    await queryClient.refetchQueries();
  });
}

/** Clicks Subscribe on `code`, accepts the mandate, and feeds Checkout.js a success. */
async function buyThroughToVerified(view: ReturnType<typeof render>, code: string) {
  await waitFor(() => expect(view.getByTestId(`plan-${code}`).textContent).toContain('Subscribe'));
  const button = view.getByTestId(`plan-${code}`).querySelector('button');
  await waitFor(() => expect(button?.disabled).toBe(false), SETTLE);
  fireEvent.click(button!);
  await waitFor(() => expect(inDocument('[data-testid="mandate-terms"]')).toBe(true), SETTLE);
  fireEvent.click(document.querySelector('#mandate-consent')!);
  const proceed = document.querySelector<HTMLButtonElement>('[data-testid="mandate-continue"]')!;
  await waitFor(() => expect(proceed.disabled).toBe(false), SETTLE);
  fireEvent.click(proceed);
  await waitFor(() => expect(opened).toHaveLength(1), SETTLE);
  act(() =>
    opened[0].handler({
      razorpay_payment_id: 'pay_1',
      razorpay_signature: 'sig',
      razorpay_subscription_id: 'sub_123',
    })
  );
  await waitFor(() => expect(has(view, 'checkout-pending')).toBe(true), SETTLE);
}

beforeEach(() => {
  opened = [];
  currentReads = [null];
  getCurrentSubscription.mockClear();
  createCheckoutSession.mockClear();
  verifyCheckout.mockClear();
  createSubscription.mockClear();
  toast.success.mockClear();
  toast.error.mockClear();
});
afterEach(() => cleanup());

describe('BillingSettingsView', () => {
  test('an above-cap plan sends acceptPerChargeAfa on the session; one below the cap does not (#452)', async () => {
    const view = screen();
    await waitFor(() => expect(view.getByTestId('plan-ENTERPRISE').textContent).toContain('Subscribe'), SETTLE);
    const enterprise = view.getByTestId('plan-ENTERPRISE').querySelector('button')!;
    await waitFor(() => expect(enterprise.disabled).toBe(false), SETTLE);
    fireEvent.click(enterprise);
    await waitFor(() => expect(createCheckoutSession).toHaveBeenCalledTimes(1), SETTLE);
    expect(createCheckoutSession.mock.calls[0][0]).toEqual({
      planCode: 'ENTERPRISE',
      billingPeriod: 'MONTHLY',
      acceptPerChargeAfa: true,
    });
    cleanup();

    const again = screen();
    await waitFor(() => expect(again.getByTestId('plan-PRO').textContent).toContain('Subscribe'), SETTLE);
    const pro = again.getByTestId('plan-PRO').querySelector('button')!;
    await waitFor(() => expect(pro.disabled).toBe(false), SETTLE);
    fireEvent.click(pro);
    await waitFor(() => expect(createCheckoutSession).toHaveBeenCalledTimes(2), SETTLE);
    expect(createCheckoutSession.mock.calls[1][0]).toEqual({
      planCode: 'PRO',
      billingPeriod: 'MONTHLY',
      acceptPerChargeAfa: false,
    });
  });

  test('an upgrade stays pending while the old ACTIVE row is returned, and activates when the bought plan is (#453)', async () => {
    currentReads = [row('ACTIVE', 'STARTER')];
    const view = screen();
    await buyThroughToVerified(view, 'PRO');

    // The old row on another plan must not end the pending state.
    await poll();
    await poll();
    expect(has(view, 'checkout-pending')).toBe(true);
    expect(toast.success).not.toHaveBeenCalled();

    currentReads = [row('ACTIVE', 'PRO', 2)];
    await poll();
    await waitFor(() => expect(has(view, 'checkout-pending')).toBe(false), SETTLE);
    expect(toast.success).toHaveBeenCalledWith('Your plan is active.');
    expect(has(view, 'activation-failed')).toBe(false);
  });

  test('a matching row on INCOMPLETE keeps polling; on INCOMPLETE_EXPIRED the pending state ends with a failure (#453)', async () => {
    currentReads = [null];
    const view = screen();
    await buyThroughToVerified(view, 'PRO');

    currentReads = [row('INCOMPLETE', 'PRO', 2)];
    await poll();
    expect(has(view, 'checkout-pending')).toBe(true);
    expect(has(view, 'activation-failed')).toBe(false);

    currentReads = [row('INCOMPLETE_EXPIRED', 'PRO', 2)];
    await poll();
    await waitFor(() => expect(has(view, 'checkout-pending')).toBe(false), SETTLE);
    const failed = view.getByTestId('activation-failed');
    expect(failed.textContent).toContain('Activation did not complete');
    expect(failed.textContent).toContain('Professional Plan');
    expect(failed.textContent).toContain('The payment authorization was not completed in time');
    expect(toast.success).not.toHaveBeenCalled();
  });

  test('a 403 on the subscription read shows the admin-only notice and no picker (#456)', async () => {
    currentReads = [new ApiError('Access Denied', 403, 'uri=/api/v1/billing/subscriptions/web/current')];
    const view = screen();
    await waitFor(() => expect(has(view, 'billing-admin-only')).toBe(true), SETTLE);
    expect(view.getByTestId('billing-admin-only').textContent).toContain(BILLING_ADMIN_ONLY_MESSAGE);
    expect(has(view, 'plan-picker')).toBe(false);
    expect(has(view, 'subscription-status')).toBe(false);
  });

  test('a free plan goes to the self-service subscription endpoint, never a checkout session (#451)', async () => {
    const view = screen();
    await waitFor(() => expect(view.getByTestId('plan-FREE').textContent).toContain('Choose free plan'), SETTLE);
    const free = view.getByTestId('plan-FREE').querySelector('button')!;
    await waitFor(() => expect(free.disabled).toBe(false), SETTLE);
    fireEvent.click(free);
    await waitFor(() => expect(createSubscription).toHaveBeenCalledTimes(1), SETTLE);
    expect(createSubscription.mock.calls[0][0]).toEqual({ planCode: 'FREE', billingPeriod: 'MONTHLY' });
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });
});
