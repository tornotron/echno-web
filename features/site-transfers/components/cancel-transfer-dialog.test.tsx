/**
 * What the cancellation confirmation does while its request is in flight.
 *
 * The reason is required, typed by hand, and the only place it exists is this
 * dialog's own state. A cancellation is refused when somebody has received
 * against the transfer since the page loaded, so the moment the reason matters
 * most is the moment the request comes back refused. Letting the dialog be
 * dismissed mid-request throws the reason away and leaves the refusal to a
 * toast, which is the failure this pins.
 *
 * Assertions are on counts and booleans, never on a rendered Radix node: an
 * assertion that fails while printing one hangs the reporter.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

import { CancelTransferDialog } from './cancel-transfer-dialog';

const onOpenChange = mock((..._args: unknown[]) => {});
const onCancelTransfer = mock((..._args: unknown[]) => {});

afterEach(() => {
  cleanup();
  onOpenChange.mockClear();
  onCancelTransfer.mockClear();
});

function renderDialog(isPending: boolean) {
  render(
    <CancelTransferDialog
      open
      onOpenChange={onOpenChange}
      returningQuantity={10}
      onCancelTransfer={onCancelTransfer}
      isPending={isPending}
    />
  );
}

/** The reason box, which exists only while the form is mounted. */
function reasonBox(): HTMLTextAreaElement | null {
  return document.body.querySelector('#cancel-reason');
}

describe('dismissing the cancellation confirmation', () => {
  test('escape closes it while nothing is in flight', () => {
    renderDialog(false);
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Escape' });
    });

    expect(onOpenChange.mock.calls.length).toBe(1);
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
  });

  test('escape is ignored while the cancellation is in flight', () => {
    renderDialog(true);
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Escape' });
    });

    // Nothing was asked to close, so the reason the person typed is still
    // on screen for the refusal to be read beside.
    expect(onOpenChange.mock.calls.length).toBe(0);
    expect(reasonBox()).not.toBeNull();
  });

  test('the keep-the-transfer button is disabled while in flight', () => {
    renderDialog(true);
    const keep = [...document.body.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Keep the transfer')
    ) as HTMLButtonElement | undefined;

    expect(keep?.disabled).toBe(true);
  });
});
