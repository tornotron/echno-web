/**
 * The request dialog behaves like the transfer cancellation dialog while its
 * request is in flight: the reason typed is the only copy there is, and a
 * refusal (a downstream document, consumed stock) has to be read beside it.
 *
 * Assertions are on counts and booleans, never on a rendered Radix node.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

import { RequestReversalDialog } from './request-reversal-dialog';

const onOpenChange = mock((..._args: unknown[]) => {});
const onRequest = mock((..._args: unknown[]) => {});

afterEach(() => {
  cleanup();
  onOpenChange.mockClear();
  onRequest.mockClear();
});

function renderDialog(isPending: boolean) {
  render(
    <RequestReversalDialog
      open
      onOpenChange={onOpenChange}
      documentLabel="site transfer ST-0031"
      movesStock
      onRequest={onRequest}
      isPending={isPending}
    />
  );
}

function reasonBox(): HTMLTextAreaElement | null {
  return document.body.querySelector('#reversal-reason');
}

function submitButton(): HTMLButtonElement | undefined {
  return [...document.body.querySelectorAll('button')].find((b) =>
    b.textContent?.includes('Request reversal')
  ) as HTMLButtonElement | undefined;
}

describe('requesting a reversal', () => {
  test('the request cannot be sent without a reason', () => {
    renderDialog(false);
    expect(submitButton()?.disabled).toBe(true);

    act(() => {
      fireEvent.change(reasonBox()!, { target: { value: 'Wrong store' } });
    });
    expect(submitButton()?.disabled).toBe(false);

    act(() => {
      fireEvent.click(submitButton()!);
    });
    expect(onRequest.mock.calls.length).toBe(1);
    expect(onRequest.mock.calls[0]?.[0]).toBe('Wrong store');
  });

  test('escape closes it while nothing is in flight', () => {
    renderDialog(false);
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Escape' });
    });
    expect(onOpenChange.mock.calls.length).toBe(1);
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
  });

  test('escape is ignored while the request is in flight', () => {
    renderDialog(true);
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Escape' });
    });
    expect(onOpenChange.mock.calls.length).toBe(0);
    expect(reasonBox()).not.toBeNull();
  });
});
