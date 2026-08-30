import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { ReverseJournalEntryDialog } from './reverse-journal-entry-dialog';

afterEach(cleanup);

function dialog(open: boolean) {
  return (
    <ReverseJournalEntryDialog
      open={open}
      onOpenChange={() => {}}
      entryNumber="JE-2026-0001"
      onConfirm={() => {}}
      isPending={false}
    />
  );
}

describe('ReverseJournalEntryDialog', () => {
  test('a reason typed for one reversal does not survive into the next', () => {
    const { rerender, getByLabelText } = render(dialog(true));
    fireEvent.change(getByLabelText('Reason'), {
      target: { value: 'Posted to the wrong cost centre' },
    });

    // On success the parent closes the dialog by flipping the `open` prop, not
    // through onOpenChange, which is exactly how journal-entries-view closes it
    // after a reversal posts. The component stays mounted, so without a reset
    // on the open transition the reason would be carried, with the confirm
    // button already enabled, into the next entry's reversal and recorded on
    // its ledger entry.
    rerender(dialog(false));
    rerender(dialog(true));

    const reasonField = getByLabelText('Reason') as HTMLTextAreaElement;
    expect(reasonField.value).toBe('');
  });

  test('the confirm button stays disabled until a reason is typed', () => {
    const { getByLabelText, getByRole } = render(dialog(true));

    const confirm = getByRole('button', { name: 'Post reversing entry' });
    expect(confirm).toBeDisabled();

    fireEvent.change(getByLabelText('Reason'), {
      target: { value: 'Duplicate of JE-2026-0002' },
    });
    expect(confirm).toBeEnabled();
  });
});
