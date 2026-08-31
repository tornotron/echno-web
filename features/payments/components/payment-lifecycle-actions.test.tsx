/**
 * Which actions a payment voucher offers, what they send, and what they say
 * when the server refuses.
 *
 * echno-backend#636 froze a verified voucher against editing and moved
 * cancelling into its own action. Between that merge and this screen, a
 * verified voucher could be neither edited nor cancelled from anywhere in the
 * product: the edit failed with a 400 and the cancel had no button. The case
 * that closes it is `a verified voucher still offers cancel`, and the mistake
 * it guards against is gating cancel on the same rule as edit, which would look
 * tidy and re-create the dead end exactly.
 *
 * `POST /{id}/verify` is the older half. It shipped in #631 and no screen has
 * ever called it, so a voucher that had been verified said so and one that had
 * not offered no way to become one.
 *
 * Assertions are on counts, strings and booleans, never on a rendered Radix
 * node: an assertion that fails while printing one hangs the reporter. That is
 * why the disabled checks read `.disabled` rather than using `toBeDisabled`.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement } from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { ApiError } from '@/lib/api/api-client';
import { ConstructionPaymentVoucherStatus } from '@/types/finance/payment';
import type { PaymentLifecycleState } from '@/lib/utils/payment-lifecycle';

// ---------------------------------------------------------------------------
// Doubles. The component is the thing under test, so both mutations are stubs
// that record what they were handed.
// ---------------------------------------------------------------------------

const verify = {
  mutate: mock((..._args: unknown[]) => {}),
  isPending: false,
};

const cancel = {
  mutate: mock((..._args: unknown[]) => {}),
  isPending: false,
};

const errorToast = mock((..._args: unknown[]) => {});
const successToast = mock((..._args: unknown[]) => {});

mock.module('@/hooks/payments', () => ({
  useVerifyPayment: () => verify,
  useCancelPayment: () => cancel,
}));

mock.module('@/lib/styles/toast-styles', () => ({
  toast: { error: errorToast, success: successToast },
}));

const { PaymentLifecycleActions } = await import(
  './payment-lifecycle-actions'
);

const PAYMENT_ID = '11111111-1111-4111-8111-111111111111';

afterEach(() => {
  cleanup();
  verify.mutate.mockClear();
  cancel.mutate.mockClear();
  errorToast.mockClear();
  successToast.mockClear();
});

function voucher(over: Partial<PaymentLifecycleState> = {}) {
  return {
    status: ConstructionPaymentVoucherStatus.PENDING,
    ...over,
  } satisfies PaymentLifecycleState;
}

const VERIFIED = voucher({
  status: ConstructionPaymentVoucherStatus.COMPLETED,
  verifiedBy: 7,
  verifiedAt: '2026-08-31T10:00:00Z',
});

const CANCELLED = voucher({
  status: ConstructionPaymentVoucherStatus.CANCELLED,
});

function show(payment: PaymentLifecycleState) {
  return render(
    createElement(PaymentLifecycleActions, { paymentId: PAYMENT_ID, payment })
  );
}

/** Every button label currently on screen, dialog included. */
function buttonLabels(): string[] {
  return [...document.body.querySelectorAll('button')].map((b) =>
    (b.textContent ?? '').trim()
  );
}

/** The button whose label is exactly `label`. */
function button(label: string): HTMLButtonElement {
  const found = [...document.body.querySelectorAll('button')].find(
    (b) => (b.textContent ?? '').trim() === label
  );
  expect(found === undefined).toBe(false);
  return found as HTMLButtonElement;
}

/** The options object a mutation was passed alongside its variables. */
function optionsOf(m: typeof verify) {
  return m.mutate.mock.calls[0]?.[1] as {
    onError: (error: unknown) => void;
    onSuccess: () => void;
  };
}

describe('which actions a voucher offers', () => {
  test('a pending voucher offers both verify and cancel', () => {
    show(voucher());

    expect(buttonLabels()).toContain('Verify');
    expect(buttonLabels()).toContain('Cancel voucher');
  });

  test('a verified voucher no longer offers verify', () => {
    show(VERIFIED);

    expect(buttonLabels()).not.toContain('Verify');
  });

  test('a verified voucher still offers cancel, which is its only way out', () => {
    // The case the whole issue turns on. The backend refuses the edit on this
    // voucher, so if cancel were gated on the same rule the document could be
    // neither corrected nor withdrawn from any screen in the product.
    show(VERIFIED);

    expect(buttonLabels()).toContain('Cancel voucher');
  });

  test('a cancelled voucher offers neither', () => {
    show(CANCELLED);

    expect(buttonLabels()).not.toContain('Verify');
    // Cancelling is one-way, so a second cancel is a button whose only outcome
    // is a 400.
    expect(buttonLabels()).not.toContain('Cancel voucher');
  });

  test('a cancelled voucher that was verified still offers neither', () => {
    show(
      voucher({
        status: ConstructionPaymentVoucherStatus.CANCELLED,
        verifiedBy: 7,
        verifiedAt: '2026-08-31T10:00:00Z',
      })
    );

    expect(buttonLabels()).not.toContain('Verify');
    expect(buttonLabels()).not.toContain('Cancel voucher');
  });

  test('a failed voucher can still be verified', () => {
    // Verification is refused on CANCELLED only. Gating the action on a
    // successful payment would withdraw it from exactly the vouchers whose
    // figures somebody wants checked.
    show(voucher({ status: ConstructionPaymentVoucherStatus.FAILED }));

    expect(buttonLabels()).toContain('Verify');
  });

  test('a refunded voucher can still be verified', () => {
    show(voucher({ status: ConstructionPaymentVoucherStatus.REFUNDED }));

    expect(buttonLabels()).toContain('Verify');
  });
});

describe('verifying', () => {
  test('sends the id and nothing else', () => {
    show(voucher());
    fireEvent.click(button('Verify'));

    expect(verify.mutate).toHaveBeenCalledTimes(1);
    const variables = verify.mutate.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    // The backend takes the verifier from the session. A green `tsc` would not
    // catch a stray field here: excess-property checking fires on a fresh
    // object literal at the call site and nowhere else.
    expect(Object.keys(variables)).toEqual(['id']);
    expect(variables.id).toBe(PAYMENT_ID);
  });

  test('shows the server reason rather than a fixed string', () => {
    show(voucher());
    fireEvent.click(button('Verify'));

    optionsOf(verify).onError(
      new ApiError('You cannot verify a voucher you raised yourself.', 400)
    );

    expect(errorToast).toHaveBeenCalledTimes(1);
    expect(errorToast.mock.calls[0]?.[1]).toEqual({
      description: 'You cannot verify a voucher you raised yourself.',
    });
  });

  test('tells the three refusals apart', () => {
    // Same status, same screen, three different things to do about it. The
    // segregation-of-duties one is the reason a fixed string is wrong: it reads
    // as a bug rather than as the rule working.
    const reasons = [
      'This payment voucher has been cancelled.',
      'This payment voucher has already been verified.',
      'You cannot verify a voucher you raised yourself.',
    ];

    for (const reason of reasons) {
      show(voucher());
      fireEvent.click(button('Verify'));
      optionsOf(verify).onError(new ApiError(reason, 400));
      expect(errorToast.mock.calls.at(-1)?.[1]).toEqual({
        description: reason,
      });
      cleanup();
      verify.mutate.mockClear();
    }

    expect(errorToast).toHaveBeenCalledTimes(3);
  });

  test('confirms a verification that worked', () => {
    show(voucher());
    fireEvent.click(button('Verify'));

    optionsOf(verify).onSuccess();

    expect(successToast).toHaveBeenCalledTimes(1);
    expect(successToast.mock.calls[0]?.[0]).toBe('Payment verified');
  });
});

function openCancelDialog(payment: PaymentLifecycleState = voucher()) {
  const view = show(payment);
  fireEvent.click(button('Cancel voucher'));
  return view;
}

function reasonField(view: ReturnType<typeof show>) {
  return view.getByLabelText(/Reason/) as HTMLTextAreaElement;
}

/** The confirm button inside the dialog, which shares its label. */
function confirmButton(): HTMLButtonElement {
  const matches = [...document.body.querySelectorAll('button')].filter(
    (b) => (b.textContent ?? '').trim() === 'Cancel voucher'
  );
  // The trigger and the dialog's confirm carry the same words; the confirm is
  // the later one in the tree.
  expect(matches.length).toBe(2);
  return matches[1] as HTMLButtonElement;
}

describe('cancelling requires a reason', () => {
  test('the confirm button starts disabled', () => {
    openCancelDialog();

    expect(confirmButton().disabled).toBe(true);
    expect(cancel.mutate).toHaveBeenCalledTimes(0);
  });

  test('whitespace is not a reason', () => {
    // A required field satisfied by pressing the space bar is not a required
    // field. The backend's `@NotBlank` refuses it, and the point of the form
    // check is not to send it.
    const view = openCancelDialog();
    fireEvent.change(reasonField(view), { target: { value: '   ' } });

    expect(confirmButton().disabled).toBe(true);
  });

  test('a typed reason enables the confirm', () => {
    const view = openCancelDialog();
    fireEvent.change(reasonField(view), {
      target: { value: 'Duplicate of CPMT-000118' },
    });

    expect(confirmButton().disabled).toBe(false);
  });

  test('clicking confirm with a blank reason sends nothing', () => {
    // Belt and braces on the disabled attribute: a click that reaches the
    // handler anyway must not put a blank reason on the wire.
    openCancelDialog();
    fireEvent.click(confirmButton());

    expect(cancel.mutate).toHaveBeenCalledTimes(0);
  });

  test('sends the id and the trimmed reason', () => {
    const view = openCancelDialog();
    fireEvent.change(reasonField(view), {
      target: { value: '  Duplicate of CPMT-000118  ' },
    });
    fireEvent.click(confirmButton());

    expect(cancel.mutate).toHaveBeenCalledTimes(1);
    const variables = cancel.mutate.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(Object.keys(variables).toSorted()).toEqual(['id', 'reason']);
    expect(variables.id).toBe(PAYMENT_ID);
    expect(variables.reason).toBe('Duplicate of CPMT-000118');
  });

  test('a verified voucher can be cancelled through the same dialog', () => {
    const view = openCancelDialog(VERIFIED);
    fireEvent.change(reasonField(view), {
      target: { value: 'Amount was wrong; replacement raised as CPMT-000205' },
    });
    fireEvent.click(confirmButton());

    expect(cancel.mutate).toHaveBeenCalledTimes(1);
    expect(
      (cancel.mutate.mock.calls[0]?.[0] as Record<string, unknown>).reason
    ).toBe('Amount was wrong; replacement raised as CPMT-000205');
  });

  test('shows the server reason rather than a fixed string', () => {
    const view = openCancelDialog();
    fireEvent.change(reasonField(view), {
      target: { value: 'Duplicate of CPMT-000118' },
    });
    fireEvent.click(confirmButton());

    optionsOf(cancel).onError(
      new ApiError('This payment voucher has already been cancelled.', 400)
    );

    expect(errorToast).toHaveBeenCalledTimes(1);
    expect(errorToast.mock.calls[0]?.[1]).toEqual({
      description: 'This payment voucher has already been cancelled.',
    });
  });

  test('confirms a cancellation that worked', () => {
    const view = openCancelDialog();
    fireEvent.change(reasonField(view), {
      target: { value: 'Duplicate of CPMT-000118' },
    });
    fireEvent.click(confirmButton());

    optionsOf(cancel).onSuccess();

    expect(successToast).toHaveBeenCalledTimes(1);
    expect(successToast.mock.calls[0]?.[0]).toBe('Payment cancelled');
  });

  test('an abandoned reason does not survive reopening the dialog', () => {
    const view = openCancelDialog();
    fireEvent.change(reasonField(view), {
      target: { value: 'Typed then thought better of' },
    });

    fireEvent.click(button('Keep voucher'));
    fireEvent.click(button('Cancel voucher'));

    expect(reasonField(view).value).toBe('');
    expect(confirmButton().disabled).toBe(true);
  });
});
