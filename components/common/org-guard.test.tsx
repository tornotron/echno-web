/**
 * The guard used to answer every failed load with "Something went wrong.
 * Failed to load data", so a user refused by the backend (a 403 on the
 * employee list) was told the system had broken. It now words the notice by
 * status and offers the step that helps.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { ApiError } from '@tornotron/echno-core';

const backCalls: number[] = [];
const signInCalls: unknown[][] = [];

mock.module('next/navigation', () => ({
  useRouter: () => ({ back: () => backCalls.push(1) }),
}));
mock.module('next-auth/react', () => ({
  signIn: (...args: unknown[]) => {
    signInCalls.push(args);
    return Promise.resolve();
  },
}));

const { OrgGuard } = await import('./org-guard');
const { loadErrorKind } = await import('./load-error');
const { default: DashboardError } = await import('@/app/users/dashboard/error');
const { default: RootError } = await import('@/app/error');

function guard(error: unknown) {
  return render(
    <OrgGuard isLoading={false} error={error} organizationId={1}>
      <p>the page</p>
    </OrgGuard>
  );
}

afterEach(() => {
  cleanup();
  backCalls.length = 0;
  signInCalls.length = 0;
});

describe('OrgGuard error notice', () => {
  test('a 403 says the page is not available, not that something broke', () => {
    const view = guard(new ApiError('Access Denied', 403));
    const text = view.container.textContent ?? '';
    expect(text).toContain("You don't have access to this page");
    expect(text).not.toContain('Something went wrong');
    expect(text).not.toContain('the page');
    expect(view.getByText('Dashboard').closest('a')?.getAttribute('href')).toBe(
      '/users/dashboard'
    );
    fireEvent.click(view.getByText('Go back'));
    expect(backCalls).toHaveLength(1);
  });

  test('a 401 says the session expired and signs in back to this page', async () => {
    (
      globalThis as unknown as { happyDOM: { setURL(url: string): void } }
    ).happyDOM.setURL('http://localhost/users/dashboard/workforce/employees');
    const view = guard(new ApiError('Unauthorized', 401));
    expect(view.container.textContent).toContain('Your session has expired');
    fireEvent.click(view.getByText('Sign in'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(signInCalls).toEqual([
      ['keycloak', { redirectTo: '/users/dashboard/workforce/employees' }],
    ]);
  });

  test('a 404 says the item was not found', () => {
    const view = guard(new ApiError('Not found', 404));
    expect(view.container.textContent).toContain('Not found');
    expect(view.container.textContent).not.toContain('Something went wrong');
  });

  test('any other failure keeps the generic message', () => {
    expect(guard(new ApiError('boom', 500)).container.textContent).toContain(
      'Something went wrong'
    );
    cleanup();
    expect(guard(new Error('network')).container.textContent).toContain(
      'Failed to load data'
    );
  });

  test('the status is read structurally, so a boundary error still sorts', () => {
    expect(loadErrorKind({ status: 403 })).toBe('forbidden');
    expect(loadErrorKind(null)).toBe('generic');
    expect(loadErrorKind('403')).toBe('generic');
  });

  test('the error boundaries word a thrown 403 the same way', () => {
    const refused = Object.assign(new Error('Access Denied'), { status: 403 });
    for (const Boundary of [DashboardError, RootError]) {
      const text =
        render(<Boundary error={refused} reset={() => {}} />).container
          .textContent ?? '';
      expect(text).toContain("You don't have access to this page");
      expect(text).not.toContain('Try Again');
      cleanup();
    }
    const crash = new Error('boom');
    expect(
      render(<DashboardError error={crash} reset={() => {}} />).container
        .textContent
    ).toContain('Try Again');
  });
});
