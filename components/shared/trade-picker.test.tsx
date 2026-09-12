import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render } from '@testing-library/react';
import type { OrgTrade } from '@tornotron/echno-core/inspection/types';

let trades: OrgTrade[] | undefined;

mock.module('@tornotron/echno-core/inspection/hooks', () => ({
  useOrgTrades: () => ({ data: trades, isLoading: trades === undefined }),
  useOrgElementTypes: () => ({ data: [], isLoading: false }),
}));

const { TradePicker } = await import('./trade-picker');

function row(over: Partial<OrgTrade>): OrgTrade {
  return {
    id: `id-${over.code}`,
    code: 'x',
    name: 'X',
    groupCode: 'structural',
    sortOrder: 0,
    active: true,
    ...over,
  };
}

afterEach(() => {
  cleanup();
  trades = undefined;
});

describe('TradePicker', () => {
  test('renders the organization trades through the core hook, grouped', () => {
    trades = [
      row({
        code: 'precast-erection',
        name: 'Precast erection',
        groupCode: 'structural',
        sortOrder: 40,
      }),
      row({ code: 'rcc', name: 'RCC', groupCode: 'structural', sortOrder: 4 }),
      row({
        code: 'fire-systems',
        name: 'Fire systems',
        groupCode: 'fire',
        sortOrder: 20,
      }),
      row({
        code: 'old-trade',
        name: 'Old trade',
        groupCode: 'fire',
        active: false,
      }),
    ];
    const onChange = mock((..._args: unknown[]) => {});
    const { getByLabelText, getAllByRole } = render(
      <TradePicker
        value=""
        emptyLabel="All trades"
        onChange={onChange}
        aria-label="Trade"
      />
    );

    const groups = getAllByRole('group').map((g) => g.getAttribute('label'));
    expect(groups).toEqual(['Structural', 'Fire']);

    const options = getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual([
      'All trades',
      'RCC',
      'Precast erection',
      'Fire systems',
    ]);

    fireEvent.change(getByLabelText('Trade'), {
      target: { value: 'precast-erection' },
    });
    expect(onChange).toHaveBeenCalledWith('precast-erection', trades[0]);
  });

  test('leaves out excluded codes and keeps a stray selected value', () => {
    trades = [
      row({ code: 'rcc', name: 'RCC' }),
      row({ code: 'masonry', name: 'Masonry', groupCode: 'masonry' }),
      row({ code: 'old-trade', name: 'Old trade', active: false }),
    ];
    const { getAllByRole } = render(
      <TradePicker
        value="old-trade"
        exclude={new Set(['rcc'])}
        onChange={() => {}}
        aria-label="Trade"
      />
    );
    const options = getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual([
      'Select a trade',
      'Old trade (inactive)',
      'Masonry',
    ]);
  });

  test('falls back to the sixteen legacy trades while the list is loading', () => {
    trades = undefined;
    const { getAllByRole, getByLabelText } = render(
      <TradePicker
        value=""
        emptyLabel="All trades"
        onChange={() => {}}
        aria-label="Trade"
      />
    );
    expect(getByLabelText('Trade').getAttribute('aria-busy')).toBe('true');
    expect(getAllByRole('option')).toHaveLength(17);
  });
});
