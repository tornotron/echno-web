/**
 * Plan picker and status card (#448): the four seeded plans render with
 * their module features, the current plan and its status are shown, the
 * plan that includes the module the buyer came for is highlighted, and a
 * backend with no provider disables checkout with a clear message.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { parsePlan, parseSubscription } from '@tornotron/echno-core/billing/types';
import { BILLING_NOT_CONFIGURED_MESSAGE, PlanPicker } from './plan-picker';
import { SubscriptionStatusCard, describeSubscription } from './subscription-status-card';

afterEach(() => cleanup());

const feature = (id: number, code: string, name: string) => ({
  id,
  featureCode: code,
  featureName: name,
  featureType: 'BOOLEAN',
  enabled: true,
});

const plans = [
  { id: 1, code: 'FREE', name: 'Free Plan', monthlyPrice: 0, annualPrice: 0, sortOrder: 1, features: [] },
  {
    id: 2,
    code: 'STARTER',
    name: 'Starter Plan',
    monthlyPrice: 2999,
    annualPrice: 29_990,
    sortOrder: 2,
    features: [feature(1, 'MODULE_ATTENDANCE', 'Attendance')],
  },
  {
    id: 3,
    code: 'PRO',
    name: 'Professional Plan',
    monthlyPrice: 9999,
    annualPrice: 99_990,
    sortOrder: 3,
    features: [feature(2, 'MODULE_ATTENDANCE', 'Attendance'), feature(3, 'MODULE_INSPECTIONS', 'Inspections')],
  },
  {
    id: 4,
    code: 'ENTERPRISE',
    name: 'Enterprise Plan',
    monthlyPrice: 24_999,
    annualPrice: 249_990,
    sortOrder: 4,
    features: [feature(4, 'MODULE_INSPECTIONS', 'Inspections'), feature(5, 'MODULE_BIM', 'BIM')],
  },
].map((dto) => parsePlan(dto));

const razorpay = {
  provider: 'RAZORPAY' as const,
  enabled: true,
  keyId: 'rzp_test_abc',
  currency: 'INR',
  afaCapPaise: 1_500_000,
  preDebitNoticeHours: 24,
};
const none = { ...razorpay, provider: 'NONE' as const, enabled: false, keyId: null };

describe('PlanPicker', () => {
  test('renders the four seeded plans with their module features and marks the current one', () => {
    const current = parseSubscription({ id: 1, status: 'ACTIVE', plan: { id: 2, code: 'STARTER' } });
    const view = render(
      <PlanPicker plans={plans} current={current} provider={razorpay} onSelect={mock()} />
    );
    for (const code of ['FREE', 'STARTER', 'PRO', 'ENTERPRISE']) {
      expect(view.getByTestId(`plan-${code}`)).toBeInTheDocument();
    }
    expect(view.getByTestId('plan-PRO').textContent).toContain('Inspections');
    expect(view.getByTestId('plan-ENTERPRISE').textContent).toContain('BIM');
    expect(view.getByTestId('plan-STARTER').textContent).toContain('Current');
    expect(view.getByText('Current plan').closest('button')).toBeDisabled();
    expect(view.queryByTestId('billing-not-configured')).not.toBeInTheDocument();
  });

  test('highlights the plans that include the module the buyer came for', () => {
    const view = render(
      <PlanPicker
        plans={plans}
        current={null}
        provider={razorpay}
        highlightFeature="MODULE_INSPECTIONS"
        onSelect={mock()}
      />
    );
    expect(view.getByTestId('plan-PRO').dataset.highlighted).toBe('true');
    expect(view.getByTestId('plan-ENTERPRISE').dataset.highlighted).toBe('true');
    expect(view.getByTestId('plan-STARTER').dataset.highlighted).toBeUndefined();
    expect(view.getByTestId('plan-FREE').dataset.highlighted).toBeUndefined();
  });

  test('hands the plan and the chosen period to onSelect', () => {
    const onSelect = mock();
    const view = render(<PlanPicker plans={plans} current={null} provider={razorpay} onSelect={onSelect} />);
    fireEvent.click(view.getByText('Yearly'));
    fireEvent.click(view.getAllByText('Subscribe')[0]);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].code).toBe('STARTER');
    expect(onSelect.mock.calls[0][1]).toBe('ANNUAL');
  });

  test('flags a cycle above the AFA cap as needing approval on each payment', () => {
    const view = render(<PlanPicker plans={plans} current={null} provider={razorpay} onSelect={mock()} />);
    expect(view.getByTestId('plan-ENTERPRISE').querySelector('[data-testid="afa-notice"]')).not.toBeNull();
    expect(view.getByTestId('plan-PRO').querySelector('[data-testid="afa-notice"]')).toBeNull();
  });

  test('provider none keeps the plans visible but disables checkout with the message', () => {
    const view = render(<PlanPicker plans={plans} current={null} provider={none} onSelect={mock()} />);
    expect(view.getByTestId('billing-not-configured').textContent).toContain(BILLING_NOT_CONFIGURED_MESSAGE);
    for (const button of view.getAllByText('Subscribe')) {
      expect(button.closest('button')).toBeDisabled();
    }
    expect(view.getByText('Choose free plan').closest('button')).not.toBeDisabled();
  });

  test('an unanswered provider query disables checkout too (never enabled by default)', () => {
    const view = render(<PlanPicker plans={plans} current={null} provider={undefined} onSelect={mock()} />);
    expect(view.getByTestId('billing-not-configured')).toBeInTheDocument();
    expect(view.getAllByText('Subscribe')[0].closest('button')).toBeDisabled();
  });
});

describe('SubscriptionStatusCard', () => {
  test('describes trial, active, past due with the grace message, and cancelled', () => {
    const base = { id: 1, plan: { id: 3, code: 'PRO', name: 'Professional Plan', monthlyPrice: 9999 } };
    expect(describeSubscription(parseSubscription({ ...base, status: 'TRIALING' })).label).toBe('Trial');
    expect(describeSubscription(parseSubscription({ ...base, status: 'ACTIVE' })).label).toBe('Active');
    const pastDue = describeSubscription(parseSubscription({ ...base, status: 'PAST_DUE' }));
    expect(pastDue.label).toBe('Payment overdue');
    expect(pastDue.message).toContain('grace period');
    expect(describeSubscription(parseSubscription({ ...base, status: 'CANCELED' })).label).toBe('Cancelled');
    expect(describeSubscription(null).label).toBe('No plan');
  });

  test('renders the plan name and status badge', () => {
    const sub = parseSubscription({
      id: 1,
      status: 'PAST_DUE',
      plan: { id: 3, code: 'PRO', name: 'Professional Plan', monthlyPrice: 9999 },
    });
    const view = render(<SubscriptionStatusCard subscription={sub} onCancel={mock()} />);
    expect(view.getByTestId('subscription-status-badge').textContent).toBe('Payment overdue');
    expect(view.getByTestId('subscription-status').textContent).toContain('Professional Plan');
    expect(view.getByText('Cancel at period end')).toBeInTheDocument();
  });
});
