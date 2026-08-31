/**
 * What the movement list sends when it verifies, and what it says when the
 * server says no.
 *
 * echno-backend#635 took the verifier from the session and removed the
 * `verifiedBy` request parameter, so the name this screen used to build was
 * discarded. Two things follow, and both are screen-level:
 *
 * 1. The screen gathered that name from `useCurrentUserEmployee()` and refused
 *    to act until the lookup resolved, showing "Your employee profile is still
 *    loading". The lookup no longer feeds anything, so the guard blocked the
 *    button for a value nobody wanted.
 *
 * 2. Verification can be refused now, which it never could before. Three 400s:
 *    the movement is already verified, the caller is the employee the movement
 *    belongs to, and the session resolves to no user of the organization. The
 *    old `onError` printed "Failed to verify movement" for all three, so the
 *    one a user can act on read the same as the two they cannot.
 *
 * Assertions are on captured call arguments and on strings, never on a
 * rendered Radix node: an assertion that fails while printing one hangs the
 * reporter.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as realMovementHooks from '@tornotron/echno-core/movement/hooks';
import * as realAttendanceHooks from '@/hooks/attendance';
import { ApiError } from '@/lib/api/api-client';
import type { MovementRecord } from '@tornotron/echno-core/attendance/types';

// ---------------------------------------------------------------------------
// Doubles. The component is the thing under test, so every hook it reaches
// through is a stub and the mutation records what it was handed.
// ---------------------------------------------------------------------------

const verify = {
  mutate: mock((..._args: unknown[]) => {}),
  isPending: false,
};

const errorToast = mock((..._args: unknown[]) => {});
const successToast = mock((..._args: unknown[]) => {});

const movement = {
  id: 7,
  attendanceId: 5,
  employeeId: 9,
  employeeName: 'Priya Nair',
  movementType: 'SITE_TRAVEL',
  fromLocation: 'Head office',
  toLocation: 'Riverside Tower',
  startTime: new Date('2026-08-31T09:00:00'),
  purpose: 'Slab inspection',
  isVerified: false,
  createdAt: new Date('2026-08-31T09:00:00'),
  updatedAt: new Date('2026-08-31T09:00:00'),
} as unknown as MovementRecord;

mock.module('@tornotron/echno-core/movement/hooks', () => ({
  ...realMovementHooks,
  useMovementsByAttendance: () => ({ data: [movement], isLoading: false }),
  useVerifyMovement: () => verify,
}));

mock.module('@/hooks/attendance', () => ({
  ...realAttendanceHooks,
  useAttendanceRole: () => ({ canApprove: true }),
}));

mock.module('@/lib/styles/toast-styles', () => ({
  toast: { error: errorToast, success: successToast },
}));

const { MovementManagement } = await import('./movement-management');

afterEach(() => {
  cleanup();
  verify.mutate.mockClear();
  errorToast.mockClear();
  successToast.mockClear();
});

/**
 * Renders the list and presses Verify on the single pending movement.
 *
 * A real `QueryClient` with no network behind it, so any query the tree still
 * reaches for stays pending and its `data` is `undefined`. That is deliberate
 * for `useCurrentUserEmployee`, which is not stubbed anywhere in this file:
 * unresolved is exactly the state the removed guard rejected.
 */
function pressVerify() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const { container } = render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(MovementManagement, { attendanceId: 5, employeeId: 9 })
    )
  );
  const button = [...container.querySelectorAll('button')].find((b) =>
    (b.textContent ?? '').includes('Verify')
  );
  expect(button).toBeDefined();
  fireEvent.click(button as HTMLButtonElement);
}

/** The options object the component passed alongside the variables. */
function verifyOptions() {
  return verify.mutate.mock.calls[0]?.[1] as {
    onError: (error: unknown) => void;
    onSuccess: () => void;
  };
}

describe('verifying a movement', () => {
  test('sends the id', () => {
    pressVerify();

    expect(verify.mutate).toHaveBeenCalledTimes(1);
    expect(verify.mutate.mock.calls[0]?.[0]).toEqual({ id: 7 });
  });

  test('sends no verifier', () => {
    // The assertion that would pass on a green `tsc` while the field was still
    // going out. Excess-property checking fires on a fresh object literal at
    // the call site and nowhere else, so the compiler is not what pins this.
    pressVerify();

    const variables = verify.mutate.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;

    expect(variables).not.toHaveProperty('verifiedBy');
    expect(Object.keys(variables)).toEqual(['id']);
  });

  test('acts without waiting for the signed-in employee to resolve', () => {
    // `useCurrentUserEmployee` is not stubbed anywhere in this file, so it is
    // the real hook with no query provider and resolves to nothing. That is
    // the state the old guard rejected: it returned early with a "still
    // loading" toast and never called the mutation.
    pressVerify();

    expect(verify.mutate).toHaveBeenCalledTimes(1);
    expect(errorToast).not.toHaveBeenCalled();
  });
});

describe('when the server refuses', () => {
  test('shows the reason it gave, not a fixed string', () => {
    pressVerify();

    verifyOptions().onError(
      new ApiError('You cannot verify your own movement record.', 400)
    );

    expect(errorToast).toHaveBeenCalledTimes(1);
    expect(errorToast.mock.calls[0]?.[1]).toEqual({
      description: 'You cannot verify your own movement record.',
    });
  });

  test('tells the three refusals apart', () => {
    // Same status, same screen, three different things to do about it. The old
    // handler collapsed all of them into one sentence.
    const reasons = [
      'This movement record has already been verified.',
      'You cannot verify your own movement record.',
      'No user of this organization matches the current session.',
    ];

    for (const reason of reasons) {
      pressVerify();
      verifyOptions().onError(new ApiError(reason, 400));
      expect(errorToast.mock.calls.at(-1)?.[1]).toEqual({
        description: reason,
      });
      cleanup();
      verify.mutate.mockClear();
    }

    expect(errorToast).toHaveBeenCalledTimes(3);
  });

  test('still confirms a verification that worked', () => {
    pressVerify();

    verifyOptions().onSuccess();

    expect(successToast).toHaveBeenCalledTimes(1);
    expect(successToast.mock.calls[0]?.[0]).toBe('Movement verified');
  });
});
