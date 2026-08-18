import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { SelectField } from './select-field';

afterEach(cleanup);

const options = [
  { value: 'active', label: 'Active' },
  { value: 'onHold', label: 'On Hold' },
];
const noneOption = { value: '__none__', label: 'No selection' };

describe('SelectField value-mapping (inbound)', () => {
  test('an empty value shows the sentinel option', async () => {
    const { findByText } = render(
      <SelectField
        label="Status"
        name="status"
        value=""
        set={() => {}}
        options={options}
        noneOption={noneOption}
      />
    );
    expect(await findByText('No selection')).toBeInTheDocument();
  });

  test('a real value shows that option label', async () => {
    const { findByText } = render(
      <SelectField
        label="Status"
        name="status"
        value="active"
        set={() => {}}
        options={options}
        noneOption={noneOption}
      />
    );
    expect(await findByText('Active')).toBeInTheDocument();
  });

  test('without a noneOption an empty value falls through to the placeholder', async () => {
    const { findByText } = render(
      <SelectField
        label="Status"
        name="status"
        value=""
        set={() => {}}
        options={options}
        placeholder="Pick one"
      />
    );
    expect(await findByText('Pick one')).toBeInTheDocument();
  });
});

describe('SelectField handleChange (outbound)', () => {
  test('choosing the sentinel stores an empty string', async () => {
    const calls: Array<[string, string]> = [];
    const { getByRole, findByRole } = render(
      <SelectField
        label="Status"
        name="status"
        value="active"
        set={(n, v) => calls.push([n, v])}
        options={options}
        noneOption={noneOption}
      />
    );
    const trigger = getByRole('combobox');
    fireEvent.pointerDown(trigger, { button: 0 });
    fireEvent.click(trigger);
    fireEvent.click(await findByRole('option', { name: 'No selection' }));
    expect(calls).toEqual([['status', '']]);
  });

  test('choosing a real option stores its value', async () => {
    const calls: Array<[string, string]> = [];
    const { getByRole, findByRole } = render(
      <SelectField
        label="Status"
        name="status"
        value=""
        set={(n, v) => calls.push([n, v])}
        options={options}
        noneOption={noneOption}
      />
    );
    const trigger = getByRole('combobox');
    fireEvent.pointerDown(trigger, { button: 0 });
    fireEvent.click(trigger);
    fireEvent.click(await findByRole('option', { name: 'On Hold' }));
    expect(calls).toEqual([['status', 'onHold']]);
  });
});
