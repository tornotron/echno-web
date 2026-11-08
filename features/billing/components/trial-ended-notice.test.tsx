/**
 * The trial-ended notice (ClickUp 14zdkkvzx5e) shows the organization's system
 * admin, once, that the trial is over and the organization is on the Free
 * plan. Nobody else sees it, and once dismissed it does not come back for that
 * trial.
 */
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from 'bun:test';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  parseSubscription,
  type Subscription,
} from '@tornotron/echno-core/billing/types';
import * as realBillingHooks from '@tornotron/echno-core/billing/hooks';
import * as realBillingServices from '@tornotron/echno-core/billing/services';
import * as realNavigation from 'next/navigation';
import * as realAuthorization from '@/hooks/use-authorization';

let authorization = { isSystemAdmin: true, isLoading: false };
let current: Subscription | null = null;
let history: Subscription[] = [];
let pushed: string[] = [];
const getSubscriptionHistory = mock(async () => history);

// Module mocks outlive this file; put back what other suites expect.
const saved = {
  '@tornotron/echno-core/billing/hooks': { ...realBillingHooks },
  '@tornotron/echno-core/billing/services': { ...realBillingServices },
  'next/navigation': { ...realNavigation },
  '@/hooks/use-authorization': { ...realAuthorization },
};
afterAll(() => {
  for (const [name, original] of Object.entries(saved)) {
    mock.module(name, () => original);
  }
});

mock.module('@/hooks/use-authorization', () => ({
  ...realAuthorization,
  useAuthorization: () => authorization,
}));
mock.module('next/navigation', () => ({
  ...realNavigation,
  useRouter: () => ({
    push: (href: string) => pushed.push(href),
    replace: () => {},
  }),
}));
mock.module('@tornotron/echno-core/billing/hooks', () => ({
  ...realBillingHooks,
  useCurrentSubscription: () => ({ isSuccess: true, data: current }),
}));
mock.module('@tornotron/echno-core/billing/services', () => ({
  ...realBillingServices,
  billingService: {
    ...realBillingServices.billingService,
    getSubscriptionHistory,
  },
}));

const { TrialEndedNotice } = await import('./trial-ended-notice');

const endedTrial = parseSubscription({
  id: 7,
  organizationId: 31,
  status: 'EXPIRED',
  provider: 'NONE',
  plan: { id: 3, code: 'PRO', name: 'Professional Plan' },
  trialEnd: '2026-11-02T10:00:00Z',
});
const freeRow = parseSubscription({
  id: 8,
  organizationId: 31,
  status: 'ACTIVE',
  provider: 'NONE',
  plan: { id: 1, code: 'FREE', name: 'Free Plan' },
});

function renderNotice() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<TrialEndedNotice />, { wrapper });
}

beforeEach(() => {
  globalThis.localStorage.clear();
  authorization = { isSystemAdmin: true, isLoading: false };
  current = freeRow;
  history = [freeRow, endedTrial];
  pushed = [];
  getSubscriptionHistory.mockClear();
});

afterEach(() => {
  cleanup();
  globalThis.localStorage.clear();
});

describe('TrialEndedNotice', () => {
  test('tells the system admin the trial ended and the data is locked, not deleted', async () => {
    const view = renderNotice();
    const notice = await waitFor(() => view.getByTestId('trial-ended-notice'));
    expect(notice.textContent).toContain(
      'Your Professional Plan trial ended on'
    );
    expect(notice.textContent).toContain('now on the Free plan');
    expect(notice.textContent).toContain('Nothing has been deleted');
  });

  test('View plans opens the plan picker and the notice does not come back', async () => {
    const view = renderNotice();
    fireEvent.click(await waitFor(() => view.getByText('View plans')));
    expect(pushed).toEqual(['/users/dashboard/settings/billing#plans']);
    cleanup();

    const again = renderNotice();
    await waitFor(() => expect(getSubscriptionHistory).toHaveBeenCalled());
    expect(again.queryByTestId('trial-ended-notice')).toBeNull();
  });

  test('Not now dismisses it for good as well', async () => {
    const view = renderNotice();
    fireEvent.click(await waitFor(() => view.getByText('Not now')));
    await waitFor(() =>
      expect(view.queryByTestId('trial-ended-notice')).toBeNull()
    );
    cleanup();

    const again = renderNotice();
    await waitFor(() => expect(getSubscriptionHistory).toHaveBeenCalled());
    expect(again.queryByTestId('trial-ended-notice')).toBeNull();
  });

  test('is not shown to anyone but the system admin, who alone may buy a plan', () => {
    authorization = { isSystemAdmin: false, isLoading: false };
    expect(renderNotice().container.textContent).toBe('');
    expect(getSubscriptionHistory).not.toHaveBeenCalled();
  });

  test('is not shown on a paid plan, and does not even read the history then', () => {
    current = parseSubscription({
      id: 9,
      status: 'ACTIVE',
      provider: 'RAZORPAY',
      plan: { id: 3, code: 'PRO', name: 'Professional Plan' },
    });
    expect(renderNotice().container.textContent).toBe('');
    expect(getSubscriptionHistory).not.toHaveBeenCalled();
  });
});
