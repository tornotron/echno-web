import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import * as realInvitationHooks from '@tornotron/echno-core/invitation/hooks';
import type { ValidateInviteCodeResponse } from '@tornotron/echno-core/invitation/types';

/**
 * The invite-code form shared by onboarding and the dashboard join page.
 * Pinned: a valid code refetches the organization memberships before handing
 * over (the layout and onboarding both route on that list, so a stale empty
 * one would bounce the new member back to onboarding); an invalid code shows
 * the error and hands over nothing; nothing is sent without a user id.
 */

let response: ValidateInviteCodeResponse = { valid: true };
const redeemCalls: Array<{ userId: number; inviteCode: string }> = [];

mock.module('@tornotron/echno-core/invitation/hooks', () => ({
  ...realInvitationHooks,
  useValidateInviteCodeMutation: () => ({
    isPending: false,
    isError: false,
    mutate: (
      args: { userId: number; inviteCode: string },
      options?: { onSuccess?: (result: ValidateInviteCodeResponse) => unknown }
    ) => {
      redeemCalls.push(args);
      return options?.onSuccess?.(response);
    },
  }),
}));

const { JoinOrganizationForm } = await import('./join-organization-form');

function renderForm(
  userId: number | undefined,
  onJoined: (i: unknown) => void
) {
  const client = new QueryClient();
  const invalidated: unknown[] = [];
  const original = client.invalidateQueries.bind(client);
  client.invalidateQueries = ((filters?: { queryKey?: unknown }) => {
    invalidated.push(filters?.queryKey);
    return original(filters);
  }) as typeof client.invalidateQueries;
  render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(JoinOrganizationForm, { userId, onJoined })
    )
  );
  return { invalidated };
}

const codeInput = () =>
  document.querySelector('#inviteCode') as HTMLInputElement;
const submit = () =>
  document.querySelector('button[type="submit"]') as HTMLButtonElement;

beforeEach(() => {
  response = { valid: true };
  redeemCalls.length = 0;
});

afterEach(() => cleanup());

describe('JoinOrganizationForm', () => {
  test('a valid code refetches memberships, then hands over the invitation', async () => {
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
    const joined: unknown[] = [];
    const { invalidated } = renderForm(42, (i) => joined.push(i));

    fireEvent.change(codeInput(), { target: { value: ' ab123 ' } });
    await act(async () => {
      fireEvent.click(submit());
    });

    expect(redeemCalls).toEqual([{ userId: 42, inviteCode: 'AB123' }]);
    expect(invalidated).toContainEqual(['organizations']);
    expect(joined.length).toBe(1);
    expect((joined[0] as { organizationId: number }).organizationId).toBe(7);
  });

  test('an invalid code shows the error and hands over nothing', async () => {
    response = { valid: false };
    const joined: unknown[] = [];
    const { invalidated } = renderForm(42, (i) => joined.push(i));

    fireEvent.change(codeInput(), { target: { value: 'XX999' } });
    await act(async () => {
      fireEvent.click(submit());
    });

    expect(joined.length).toBe(0);
    expect(invalidated).not.toContainEqual(['organizations']);
    expect(document.body.textContent).toContain(
      'Invalid or expired invite code'
    );
  });

  test('stays disabled until the user is known', () => {
    renderForm(undefined, () => {});
    fireEvent.change(codeInput(), { target: { value: 'AB123' } });
    expect(submit().disabled).toBe(true);
  });
});
