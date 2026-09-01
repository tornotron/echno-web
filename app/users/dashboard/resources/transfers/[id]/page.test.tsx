/**
 * What the transfer detail page offers, and what it does with the one refusal
 * a receiver can answer.
 *
 * echno-backend#660 split a cross-project transfer into two steps and made
 * `PATCH .../status` refuse everything. The deployed client's only action was
 * that endpoint, so a transfer could be created with its stock on a lorry and
 * then never received or cancelled by anybody: the state this closes is one a
 * user cannot get out of.
 *
 * The things worth pinning are the ways this can be got wrong:
 *
 * - offering nothing at all, which is the break itself;
 * - offering the actions on a transfer the server will refuse them for — a
 *   within-project one, or a partly received one being cancelled;
 * - treating the over-receipt refusal as an ordinary failure, which is a dead
 *   end, or treating every 400 as one, which offers to overrule a rule nobody
 *   has been shown;
 * - rebuilding the receipt for the second attempt rather than sending the one
 *   that was refused;
 * - offering anything at all about a shortfall, which the server accepts and
 *   which asserts nothing false.
 *
 * Assertions are on counts, strings and booleans, never on a rendered Radix
 * node: an assertion that fails while printing one hangs the reporter.
 */
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { createElement, Suspense } from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { ApiError } from '@/lib/api/api-client';
import { SiteTransferStatus } from '@tornotron/echno-core/site-transfers/types';
import type { SiteTransfer } from '@tornotron/echno-core/site-transfers/types';

import * as realNavigation from 'next/navigation';

mock.module('next/navigation', () => ({
  ...realNavigation,
  useSearchParams: () => new URLSearchParams(''),
  usePathname: () => '/users/dashboard/resources/transfers/7',
  useRouter: () => ({ push: () => {}, replace: () => {} }),
}));

/** Query keys the page asked to be dropped. */
const invalidated: unknown[] = [];

import * as realQuery from '@tanstack/react-query';

mock.module('@tanstack/react-query', () => ({
  ...realQuery,
  useQueryClient: () => ({
    getQueryData: () => {},
    invalidateQueries: (args: { queryKey: unknown }) => {
      invalidated.push(args.queryKey);
    },
  }),
}));

/** The transfer the page is rendered against, set per test. */
let transfer: SiteTransfer;

const receive = mock((..._args: unknown[]) => {});
const cancel = mock((..._args: unknown[]) => {});

import * as realTransferHooks from '@tornotron/echno-core/site-transfers/hooks';

mock.module('@tornotron/echno-core/site-transfers/hooks', () => ({
  ...realTransferHooks,
  useSiteTransfer: () => ({ data: transfer, isLoading: false }),
  useReceiveSiteTransfer: () => ({ mutate: receive, isPending: false }),
  useCancelSiteTransfer: () => ({ mutate: cancel, isPending: false }),
  // The trail needs system-admin; a page test is not the place to prove that.
  useSiteTransferStatusHistory: () => ({
    data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 },
    isLoading: false,
    error: null,
  }),
}));

const errorToast = mock((..._args: unknown[]) => {});
const successToast = mock((..._args: unknown[]) => {});

mock.module('@/lib/styles/toast-styles', () => ({
  toast: {
    error: errorToast,
    success: successToast,
    info: () => {},
    warning: () => {},
  },
}));

const { default: TransferDetailPage } = await import('./page');

/** The sentence the backend sends, from echno-backend#660. */
const REFUSAL =
  'Site transfer TRF-2026-000001 sent 10 of TNT Steel, 0 has already been ' +
  'received against it, and this receipt adds 12, which would take it to 12. ' +
  'If more really did arrive than was sent, send the receipt again with ' +
  'allowOverReceipt set, which records what arrived and posts it to the ' +
  'receiving site. Receiving less than was sent needs no such flag: the ' +
  'shortfall is left as an open variance for a stock adjustment to close.';

/** A cross-project transfer with nothing confirmed, unless told otherwise. */
function aTransfer(over: Partial<SiteTransfer> = {}): SiteTransfer {
  return {
    id: 7,
    transferNumber: 'TRF-2026-000001',
    issueDate: '2026-01-17',
    sendingPerson: { id: 3, name: 'Hrishi' },
    sendingProjectId: 2,
    sendingProjectName: 'Marina Tower',
    receivingProjectId: 6,
    receivingProjectName: 'Harbour Wing',
    status: SiteTransferStatus.pending,
    items: [
      {
        id: 84,
        materialId: 21,
        materialName: 'TNT Steel',
        sentQuantity: 10,
        receivedQuantity: null,
        inTransitQuantity: 10,
      },
    ],
    ...over,
  };
}

afterEach(() => {
  cleanup();
  receive.mockClear();
  cancel.mockClear();
  errorToast.mockClear();
  successToast.mockClear();
  invalidated.length = 0;
});

/**
 * Renders the page for the current `transfer`.
 *
 * The route reads its id with `use(params)`, so it suspends until that promise
 * settles. Rendering it needs a boundary and an awaited `act`, or every
 * assertion runs against an empty document.
 */
async function renderPage(): Promise<void> {
  await act(async () => {
    render(
      createElement(
        Suspense,
        { fallback: null },
        createElement(TransferDetailPage, {
          params: Promise.resolve({ id: '7' }),
        })
      )
    );
  });
}

/** Finds a button whose text contains `label`, anywhere on the page. */
function button(label: string): HTMLButtonElement | undefined {
  return [...document.body.querySelectorAll('button')].find((b) =>
    b.textContent?.includes(label)
  ) as HTMLButtonElement | undefined;
}

/** The receipt payload of the nth call to the receive mutation. */
function receiptOf(call: number): Record<string, unknown> {
  const args = receive.mock.calls[call] as unknown[];
  return (args[0] as { receipt: Record<string, unknown> }).receipt;
}

describe('the actions a transfer in transit offers', () => {
  test('a pending cross-project transfer can be received and cancelled', async () => {
    transfer = aTransfer();
    await renderPage();

    // Without these two the transfer is unreachable: the only action the page
    // used to carry now always returns 400.
    expect(button('Record what arrived')).toBeDefined();
    expect(button('Cancel transfer')).toBeDefined();
  });

  test('a partly received transfer can take another delivery but cannot be cancelled', async () => {
    transfer = aTransfer({
      status: SiteTransferStatus.partiallyTransferred,
      items: [
        {
          id: 84,
          materialId: 21,
          materialName: 'TNT Steel',
          sentQuantity: 10,
          receivedQuantity: 6,
          inTransitQuantity: 4,
        },
      ],
    });
    await renderPage();

    expect(button('Record what arrived')).toBeDefined();
    expect(button('Cancel transfer')).toBeUndefined();
  });

  test('a within-project transfer offers neither, because it never left the site', async () => {
    transfer = aTransfer({
      sendingProjectId: 2,
      receivingProjectId: 2,
      status: SiteTransferStatus.completed,
      items: [
        {
          id: 84,
          materialId: 21,
          materialName: 'TNT Steel',
          sentQuantity: 10,
          receivedQuantity: 10,
          inTransitQuantity: 0,
        },
      ],
    });
    await renderPage();

    expect(button('Record what arrived')).toBeUndefined();
    expect(button('Cancel transfer')).toBeUndefined();
  });

  test('the page no longer offers to mark a status', async () => {
    transfer = aTransfer();
    await renderPage();

    // The old advance button. The endpoint behind it now refuses everything,
    // so an offer to press it is an offer of a guaranteed failure.
    expect(document.body.textContent).not.toContain('Mark as');
  });
});

describe('what the page says about where the stock is', () => {
  test('an open transfer says the stock is counted at neither site', async () => {
    transfer = aTransfer();
    await renderPage();

    expect(document.body.textContent).toContain(
      'has not been confirmed at the receiving one'
    );
  });

  test('a shortfall is shown as open, and nothing offers to write it off', async () => {
    transfer = aTransfer({
      status: SiteTransferStatus.completed,
      items: [
        {
          id: 84,
          materialId: 21,
          materialName: 'TNT Steel',
          sentQuantity: 10,
          receivedQuantity: 8,
          inTransitQuantity: 2,
        },
      ],
    });
    await renderPage();

    const text = document.body.textContent ?? '';
    expect(text).toContain('unaccounted for');
    expect(text).toContain('stock adjustment');
    // The transfer writes no loss movement of its own, and neither does this.
    expect(text.toLowerCase()).not.toContain('write off');
    expect(text.toLowerCase()).not.toContain('write it off');
  });
});

describe('recording what arrived', () => {
  test('the form is prefilled with what is still in transit, not what was sent', async () => {
    transfer = aTransfer({
      status: SiteTransferStatus.partiallyTransferred,
      items: [
        {
          id: 84,
          materialId: 21,
          materialName: 'TNT Steel',
          sentQuantity: 10,
          receivedQuantity: 6,
          inTransitQuantity: 4,
        },
      ],
    });
    await renderPage();
    act(() => {
      button('Record what arrived')?.click();
    });

    const input = document.body.querySelector(
      '#received-84'
    ) as HTMLInputElement;
    // Prefilling 10 would provoke the over-receipt refusal on every second
    // delivery, which teaches people to click past it.
    expect(input.value).toBe('4');
  });

  test('a short delivery is sent with no acknowledgement and no confirmation', async () => {
    transfer = aTransfer();
    await renderPage();
    act(() => {
      button('Record what arrived')?.click();
    });

    const input = document.body.querySelector(
      '#received-84'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '8' } });
    act(() => {
      button('Record delivery')?.click();
    });

    expect(receive.mock.calls.length).toBe(1);
    expect(receiptOf(0).items).toEqual([{ itemId: 84, receivedQuantity: 8 }]);
    // Eight against ten sent asserts nothing false. A flag here would say
    // somebody had to defend an honest short delivery.
    expect('allowOverReceipt' in receiptOf(0)).toBe(false);
  });

  test('zero is sent as zero, which says the line was looked at', async () => {
    transfer = aTransfer();
    await renderPage();
    act(() => {
      button('Record what arrived')?.click();
    });

    const input = document.body.querySelector(
      '#received-84'
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '0' } });
    act(() => {
      button('Record delivery')?.click();
    });

    expect(receiptOf(0).items).toEqual([{ itemId: 84, receivedQuantity: 0 }]);
  });
});

/** Files a receipt and answers the mutation with `error`. */
async function fileAndRefuse(error: unknown) {
  transfer = aTransfer();
  await renderPage();
  act(() => {
    button('Record what arrived')?.click();
  });
  const input = document.body.querySelector('#received-84') as HTMLInputElement;
  fireEvent.change(input, { target: { value: '12' } });
  act(() => {
    button('Record delivery')?.click();
  });

  const handlers = receive.mock.calls[0][1] as {
    onError: (e: unknown) => void;
  };
  act(() => {
    handlers.onError(error);
  });
}

describe('the over-receipt refusal', () => {
  test('the figures are read out, and the API instruction is not', async () => {
    await fileAndRefuse(new ApiError(REFUSAL, 400));

    const text = document.body.textContent ?? '';
    expect(text).toContain('sent 10 of TNT Steel');
    expect(text).toContain('which would take it to 12');
    // Telling a storekeeper to set a payload field is the client's job, not
    // theirs.
    expect(text).not.toContain('allowOverReceipt');
  });

  test('it is not left to a toast, which can be missed', async () => {
    await fileAndRefuse(new ApiError(REFUSAL, 400));

    expect(errorToast.mock.calls.length).toBe(0);
    expect(document.body.textContent).toContain(
      'More arrived than this transfer sent'
    );
  });

  test('acknowledging it files the same receipt again, not one rebuilt from the form', async () => {
    await fileAndRefuse(new ApiError(REFUSAL, 400));

    act(() => {
      button('Record the excess')?.click();
    });

    expect(receive.mock.calls.length).toBe(2);
    expect(receiptOf(1).allowOverReceipt).toBe(true);
    expect(receiptOf(1).items).toEqual(receiptOf(0).items);
    expect('allowOverReceipt' in receiptOf(0)).toBe(false);
  });

  test('another 400 is a plain failure and offers nothing to acknowledge', async () => {
    await fileAndRefuse(
      new ApiError('Transfer has already been completed', 400)
    );

    // Offering "record it anyway" here would be offering an acknowledgement of
    // something nobody has been shown.
    expect(errorToast.mock.calls.length).toBe(1);
    expect(button('Record the excess')).toBeUndefined();
  });

  test('a refused receipt does not leave the page reasoning from stale figures', async () => {
    await fileAndRefuse(new ApiError(REFUSAL, 400));

    // The server has just re-read the transfer to judge this receipt, and an
    // over-receipt is judged against what has already arrived. A colleague
    // confirming the same lorry in between decides this one.
    expect(
      invalidated.some(
        (key) =>
          Array.isArray(key) &&
          key[0] === 'site-transfers' &&
          key[1] === 'detail'
      )
    ).toBe(true);
  });
});

describe('cancelling a transfer that never arrived', () => {
  test('a reason is required before the stock goes back', async () => {
    transfer = aTransfer();
    await renderPage();
    act(() => {
      button('Cancel transfer')?.click();
    });

    const confirm = button('Cancel and return the stock');
    expect(confirm?.disabled).toBe(true);

    const reason = document.body.querySelector(
      '#cancel-reason'
    ) as HTMLTextAreaElement;
    fireEvent.change(reason, {
      target: { value: 'Lorry turned back at the gate' },
    });

    expect(button('Cancel and return the stock')?.disabled).toBe(false);
  });

  test('the reason reaches the server', async () => {
    transfer = aTransfer();
    await renderPage();
    act(() => {
      button('Cancel transfer')?.click();
    });
    const reason = document.body.querySelector(
      '#cancel-reason'
    ) as HTMLTextAreaElement;
    fireEvent.change(reason, {
      target: { value: 'Lorry turned back at the gate' },
    });
    act(() => {
      button('Cancel and return the stock')?.click();
    });

    expect(cancel.mock.calls.length).toBe(1);
    const args = cancel.mock.calls[0] as unknown[];
    expect(args[0]).toEqual({
      id: 7,
      cancellation: { reason: 'Lorry turned back at the gate' },
    });
  });

  test('it says what is going back, so it does not read as a delete', async () => {
    transfer = aTransfer();
    await renderPage();
    act(() => {
      button('Cancel transfer')?.click();
    });

    const text = document.body.textContent ?? '';
    expect(text).toContain('10 will go back to the sending site');
    expect(text).toContain('not a deletion');
  });
});
