import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { SubcategoryField } from './subcategory-field';

afterEach(cleanup);

const options = [
  { name: 'Excavation', description: 'Digging to the required depth.' },
  { name: 'Backfilling' },
];

async function choose(
  getByRole: (role: string) => HTMLElement,
  findByRole: (role: string, opts: { name: string }) => Promise<HTMLElement>,
  name: string
) {
  const trigger = getByRole('combobox');
  fireEvent.pointerDown(trigger, { button: 0 });
  fireEvent.click(trigger);
  fireEvent.click(await findByRole('option', { name }));
}

describe('SubcategoryField', () => {
  test('a standard value shows in the dropdown with its description', async () => {
    const { findByText, queryByLabelText } = render(
      <SubcategoryField
        id="sub"
        value="Excavation"
        onChange={() => {}}
        options={options}
      />
    );
    expect(await findByText('Excavation')).toBeInTheDocument();
    expect(
      await findByText('Digging to the required depth.')
    ).toBeInTheDocument();
    expect(queryByLabelText('Sub-category, typed in')).toBeNull();
  });

  test('a saved value that is not in the list opens in the text box', () => {
    const { getByLabelText } = render(
      <SubcategoryField
        id="sub"
        value="Rock chiselling"
        onChange={() => {}}
        options={options}
      />
    );
    expect(getByLabelText('Sub-category, typed in')).toHaveValue(
      'Rock chiselling'
    );
  });

  test('choosing a sub-category hands back its name', async () => {
    const calls: string[] = [];
    const { getByRole, findByRole } = render(
      <SubcategoryField
        id="sub"
        value=""
        onChange={(v) => calls.push(v)}
        options={options}
      />
    );
    await choose(getByRole, findByRole, 'Backfilling');
    expect(calls).toEqual(['Backfilling']);
  });

  test('choosing Other opens the text box, and typing hands back the text', async () => {
    const calls: string[] = [];
    const { getByRole, findByRole, findByLabelText } = render(
      <SubcategoryField
        id="sub"
        value=""
        onChange={(v) => calls.push(v)}
        options={options}
      />
    );
    await choose(getByRole, findByRole, 'Other (type your own)');
    fireEvent.change(await findByLabelText('Sub-category, typed in'), {
      target: { value: 'Dewatering' },
    });
    expect(calls).toEqual(['Dewatering']);
  });

  test('choosing No sub-category hands back an empty string', async () => {
    const calls: string[] = [];
    const { getByRole, findByRole } = render(
      <SubcategoryField
        id="sub"
        value="Excavation"
        onChange={(v) => calls.push(v)}
        options={options}
      />
    );
    await choose(getByRole, findByRole, 'No sub-category');
    expect(calls).toEqual(['']);
  });
});
