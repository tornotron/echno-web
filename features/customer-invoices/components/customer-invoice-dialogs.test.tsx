import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { CancelInvoiceDialog } from './customer-invoice-dialogs';

afterEach(cleanup);

function dialog(open: boolean, caveat?: string) {
  return (
    <CancelInvoiceDialog
      open={open}
      onOpenChange={() => {}}
      invoiceNumber="INV-2026-0001"
      postsReversal
      caveat={caveat}
      onConfirm={() => {}}
      isPending={false}
    />
  );
}

describe('CancelInvoiceDialog', () => {
  test('the confirm button stays disabled until a reason is typed', () => {
    const { getByLabelText, getByRole } = render(dialog(true));

    const confirm = getByRole('button', { name: 'Cancel invoice' });
    expect(confirm).toBeDisabled();

    fireEvent.change(getByLabelText('Reason'), {
      target: { value: 'Customer withdrew the order' },
    });
    expect(confirm).toBeEnabled();
  });

  test('a reason typed for one invoice does not survive into the next', () => {
    const { rerender, getByLabelText } = render(dialog(true));
    fireEvent.change(getByLabelText('Reason'), {
      target: { value: 'Raised against the wrong customer' },
    });

    // A successful cancellation closes the dialog by flipping `open` from the
    // view, not through onOpenChange, so without a reset on the open
    // transition this reason would be carried into the next invoice's
    // cancellation and written onto its reversing entry.
    rerender(dialog(false));
    rerender(dialog(true));

    const reasonField = getByLabelText('Reason') as HTMLTextAreaElement;
    expect(reasonField.value).toBe('');
  });

  test('the source caveat is put in front of the user before they commit', () => {
    const { getByText } = render(
      dialog(true, 'If this invoice was raised by a construction invoice')
    );
    expect(getByText(/raised by a construction invoice/).textContent).toContain(
      'construction invoice'
    );
  });
});
