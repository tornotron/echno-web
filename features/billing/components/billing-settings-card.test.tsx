/**
 * The settings page's Billing card (#456) renders for the organization's
 * system admin only; a director, a member, or a reader whose roles are still
 * loading gets nothing rather than a link into a page that answers 403.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';

let authorization = { isSystemAdmin: false, isLoading: false };
let pushed: string[] = [];

mock.module('@/hooks/use-authorization', () => ({
  useAuthorization: () => authorization,
}));
mock.module('next/navigation', () => ({
  useRouter: () => ({ push: (href: string) => pushed.push(href), replace: () => {} }),
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/users/dashboard/settings',
}));

const { BillingSettingsCard } = await import('./billing-settings-card');

afterEach(() => {
  cleanup();
  authorization = { isSystemAdmin: false, isLoading: false };
  pushed = [];
});

describe('BillingSettingsCard', () => {
  test('renders for a system admin and links to the billing page', () => {
    authorization = { isSystemAdmin: true, isLoading: false };
    const view = render(<BillingSettingsCard />);
    expect(view.queryByTestId('billing-settings-card') !== null).toBe(true);
    fireEvent.click(view.getByText('Manage plan and billing'));
    expect(pushed).toEqual(['/users/dashboard/settings/billing']);
  });

  test('renders nothing for anyone else, and nothing while the roles are loading', () => {
    authorization = { isSystemAdmin: false, isLoading: false };
    expect(render(<BillingSettingsCard />).container.textContent).toBe('');
    cleanup();
    authorization = { isSystemAdmin: true, isLoading: true };
    expect(render(<BillingSettingsCard />).container.textContent).toBe('');
  });
});
