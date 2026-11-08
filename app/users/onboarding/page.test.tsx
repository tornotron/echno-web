/**
 * Where a signed-in person with no organization lands.
 *
 * A person joins only by accepting an invitation sent to their address, so
 * there is nothing to fill in here. Pinned: the page tells them to ask their
 * administrator and offers no way to create or join an organization; a
 * person who already belongs to one is sent into the dashboard. Every module
 * replaced here is put back when the file ends.
 *
 * Assertions are on counts, strings and booleans, never on a rendered node.
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
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render } from '@testing-library/react';
import * as realNavigation from 'next/navigation';
import * as realAuthClient from '@/lib/auth/client';
import * as realUserHooks from '@tornotron/echno-core/user/hooks';
import * as realOrgHooks from '@tornotron/echno-core/organization/hooks';

const originals = {
  navigation: { ...realNavigation },
  authClient: { ...realAuthClient },
  user: { ...realUserHooks },
  org: { ...realOrgHooks },
};

const replaceCalls: string[] = [];
const signOutCalls: unknown[] = [];
let organizations: Array<{ id: number }> = [];

mock.module('next/navigation', () => ({
  ...originals.navigation,
  usePathname: () => '/users/onboarding',
  useRouter: () => ({
    push: () => {},
    replace: (href: string) => replaceCalls.push(href),
  }),
}));
mock.module('@/lib/auth/client', () => ({
  ...originals.authClient,
  signOut: (options: unknown) => {
    signOutCalls.push(options);
    return Promise.resolve();
  },
}));
mock.module('@tornotron/echno-core/user/hooks', () => ({
  ...originals.user,
  useUser: () => ({
    data: { id: 42, email: 'new.person@company.test' },
    isLoading: false,
  }),
}));
mock.module('@tornotron/echno-core/organization/hooks', () => ({
  ...originals.org,
  useOrganizationSummaries: () => ({ data: organizations, isLoading: false }),
}));

const { default: OnboardingPage } = await import('./page');
const { routes } = await import('@/nav');

afterAll(() => {
  mock.module('next/navigation', () => originals.navigation);
  mock.module('@/lib/auth/client', () => originals.authClient);
  mock.module('@tornotron/echno-core/user/hooks', () => originals.user);
  mock.module('@tornotron/echno-core/organization/hooks', () => originals.org);
});

function renderPage() {
  const client = new QueryClient();
  return render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(OnboardingPage)
    )
  );
}

const buttons = () =>
  [...document.querySelectorAll('button')].map((b) => b.textContent?.trim());

beforeEach(() => {
  replaceCalls.length = 0;
  signOutCalls.length = 0;
  organizations = [];
});

afterEach(() => cleanup());

describe('OnboardingPage', () => {
  test('tells a person with no organization to ask their administrator', () => {
    renderPage();
    const text = document.body.textContent ?? '';
    expect(text).toContain('You are not part of an organization yet');
    expect(text).toContain('Ask your administrator to invite you');
    expect(text).toContain('new.person@company.test');
  });

  test('offers no way to create or join an organization', () => {
    renderPage();
    expect(document.querySelectorAll('[role="tab"]').length).toBe(0);
    expect(document.querySelectorAll('input').length).toBe(0);
    expect(buttons()).toEqual(['Sign out']);
  });

  test('signing out returns to the landing page', () => {
    renderPage();
    fireEvent.click([...document.querySelectorAll('button')][0]);
    expect(signOutCalls).toEqual([{ callbackUrl: '/' }]);
  });

  test('a person who belongs to an organization is sent into the dashboard', () => {
    organizations = [{ id: 7 }];
    renderPage();
    expect(replaceCalls).toEqual([routes.href]);
    expect(document.body.textContent).not.toContain('Ask your administrator');
  });
});
