/**
 * First-run onboarding for a signed-in user with no organization.
 *
 * The dashboard layout sends every org-less user here, so this page is the
 * only place an invited user can redeem their code. Before the join path was
 * added it offered only "Create Organization", and an invited user had no way
 * in. Pinned: both paths are offered; redeeming a code makes the joined
 * organization the default and enters the dashboard.
 *
 * Assertions are on counts, strings and booleans, never on a rendered Radix
 * node: an assertion that fails while printing one hangs the reporter.
 */
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import type { ValidateInviteCodeResponse } from '@tornotron/echno-core/invitation/types';

const replaceCalls: string[] = [];

import * as realNavigation from 'next/navigation';

mock.module('next/navigation', () => ({
  ...realNavigation,
  usePathname: () => '/users/onboarding',
  useRouter: () => ({
    push: () => {},
    replace: (href: string) => replaceCalls.push(href),
  }),
}));

import * as realNextAuth from 'next-auth/react';

mock.module('next-auth/react', () => ({
  ...realNextAuth,
  signOut: () => Promise.resolve(),
  useSession: () => ({ data: null, status: 'authenticated' }),
}));

const setDefaultCalls: Array<{ id: number; organizationId: number }> = [];

import * as realUserHooks from '@tornotron/echno-core/user/hooks';

mock.module('@tornotron/echno-core/user/hooks', () => ({
  ...realUserHooks,
  useUser: () => ({ data: { id: 42 }, isLoading: false }),
  useUpdateUserOrganization: () => ({
    mutate: (args: { id: number; organizationId: number }) =>
      setDefaultCalls.push(args),
  }),
}));

import * as realOrgHooks from '@tornotron/echno-core/organization/hooks';

mock.module('@tornotron/echno-core/organization/hooks', () => ({
  ...realOrgHooks,
  useOrganizationSummaries: () => ({ data: [], isLoading: false }),
  useCreateOrganization: () => ({ mutate: () => {}, isPending: false }),
}));

let response: ValidateInviteCodeResponse = { valid: true };

import * as realInvitationHooks from '@tornotron/echno-core/invitation/hooks';

mock.module('@tornotron/echno-core/invitation/hooks', () => ({
  ...realInvitationHooks,
  useValidateInviteCodeMutation: () => ({
    isPending: false,
    isError: false,
    mutate: (
      _args: unknown,
      options?: { onSuccess?: (result: ValidateInviteCodeResponse) => unknown }
    ) => options?.onSuccess?.(response),
  }),
}));

mock.module('@/lib/styles/toast-styles', () => ({
  toast: { success: () => {}, error: () => {} },
}));

const { default: OnboardingPage } = await import('./page');
const { routes } = await import('@/nav');

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

const tab = (label: string) =>
  [...document.querySelectorAll('[role="tab"]')].find((t) =>
    t.textContent?.includes(label)
  ) as HTMLElement | undefined;

beforeEach(() => {
  replaceCalls.length = 0;
  setDefaultCalls.length = 0;
  response = {
    valid: true,
    invitation: {
      inviteCode: 'AB123',
      organizationId: 7,
      organizationName: 'Acme Builders',
      usedCount: 0,
      isActive: true,
    } as ValidateInviteCodeResponse['invitation'],
  };
});

afterEach(() => cleanup());

describe('OnboardingPage', () => {
  test('offers both creating an organization and joining one', () => {
    renderPage();
    expect(tab('Create Organization')).toBeDefined();
    expect(tab('Join with Invitation Code')).toBeDefined();
  });

  test('redeeming a code sets the joined organization as default and enters the dashboard', async () => {
    renderPage();
    await act(async () => {
      fireEvent.mouseDown(tab('Join with Invitation Code')!, { button: 0 });
    });

    const input = document.querySelector('#inviteCode') as HTMLInputElement;
    expect(input).not.toBeNull();
    fireEvent.change(input, { target: { value: 'AB123' } });
    await act(async () => {
      fireEvent.click(
        document.querySelector('button[type="submit"]') as HTMLButtonElement
      );
    });

    expect(setDefaultCalls).toEqual([{ id: 42, organizationId: 7 }]);
    expect(replaceCalls).toEqual([routes.href]);
  });
});
