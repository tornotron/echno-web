import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import { FormField } from './form-field';

afterEach(cleanup);

describe('FormField', () => {
  test('renders the label and its child control', async () => {
    const { findByText, getByTestId } = render(
      <FormField label="Name" htmlFor="name">
        <input data-testid="ctrl" id="name" />
      </FormField>
    );
    expect(await findByText('Name')).toBeInTheDocument();
    expect(getByTestId('ctrl')).toBeInTheDocument();
  });

  test('shows the required asterisk only when required', () => {
    const { queryByText, rerender } = render(
      <FormField label="Name">
        <input />
      </FormField>
    );
    expect(queryByText('*')).toBeNull();
    rerender(
      <FormField label="Name" required>
        <input />
      </FormField>
    );
    // The asterisk is rendered as " *" inside its own span.
    expect(queryByText('*')).not.toBeNull();
  });

  test('renders the error paragraph only when an error is present', () => {
    const { queryByText, rerender } = render(
      <FormField label="Name">
        <input />
      </FormField>
    );
    expect(queryByText('Name is required')).toBeNull();
    rerender(
      <FormField label="Name" error="Name is required">
        <input />
      </FormField>
    );
    expect(queryByText('Name is required')).not.toBeNull();
  });
});
