/**
 * The rendered 403 card (#456): a module denial shows "Upgrade plan" to a
 * system admin and "ask your administrator" to a member, with no link into
 * the billing page for the member.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';

let authorization = { isSystemAdmin: false, isLoading: false };

mock.module('@/hooks/use-authorization', () => ({
  useAuthorization: () => authorization,
}));

const { ForbiddenView } = await import('./forbidden-view');

afterEach(() => {
  cleanup();
  authorization = { isSystemAdmin: false, isLoading: false };
});

const links = (root: HTMLElement) => [...root.querySelectorAll('a')].map((a) => a.getAttribute('href'));

describe('ForbiddenView', () => {
  test('a system admin denied a module gets the upgrade link', () => {
    authorization = { isSystemAdmin: true, isLoading: false };
    const view = render(<ForbiddenView params={{ reason: 'module', module: 'bim' }} />);
    expect(view.container.textContent).toContain('Upgrade plan');
    expect(links(view.container)).toContain('/users/dashboard/settings/billing?feature=MODULE_BIM#plans');
  });

  test('a member denied a module is told to ask an administrator and gets no billing link', () => {
    authorization = { isSystemAdmin: false, isLoading: false };
    const view = render(<ForbiddenView params={{ reason: 'module', module: 'bim' }} />);
    expect(view.container.textContent).not.toContain('Upgrade plan');
    expect(view.getByTestId('forbidden-advice').textContent).toContain('Ask your administrator to upgrade');
    expect(links(view.container).some((href) => href?.includes('/settings/billing'))).toBe(false);
    expect(view.container.textContent).toContain('Go to Dashboard');
  });
});
