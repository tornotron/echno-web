'use client';

import { useMemo } from 'react';
import type { OrgTrade } from '@tornotron/echno-core/inspection/types';
import {
  catalogueGroupLabel,
  groupCatalogueRows,
  inspectionTradeLabel,
  inspectionTradeOrder,
} from '@tornotron/echno-core/inspection/types';
import { useOrgTrades } from '@tornotron/echno-core/inspection/hooks';
import { cn } from '@/lib/utils/index';

interface TradePickerProps {
  /** The selected trade code, or empty for none. */
  value: string;
  /** Called with the code and, when it is one of the organization's rows, the row. */
  onChange: (code: string, trade: OrgTrade | undefined) => void;
  /**
   * An option rendered first with an empty-string value. A filter passes
   * "All trades"; a form passes "No trade" or leaves it out to force a choice.
   */
  emptyLabel?: string;
  /** Codes to leave out, e.g. trades that already hold a checklist. */
  exclude?: ReadonlySet<string>;
  id?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const TRADE_SELECT_CLASS =
  'border-input bg-background h-9 w-full rounded-md border px-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50';

/**
 * A trade picker driven by the organization's trade list, grouped under the
 * group headings the catalogue seeds. While the list is loading or if it
 * fails, the sixteen legacy trades stand in so the control is never dead. A
 * value the list does not hold (an inactive trade on an old row) is kept as
 * an extra option so an existing selection is never silently dropped.
 */
export function TradePicker({
  value,
  onChange,
  emptyLabel,
  exclude,
  id,
  disabled,
  className,
  'aria-label': ariaLabel,
}: TradePickerProps) {
  const { data: trades, isLoading, isError } = useOrgTrades();

  const groups = useMemo(() => {
    // A successful answer is the organization's word, even when empty; the
    // legacy list stands in only while loading or after a failed fetch.
    if (trades !== undefined && !isError) {
      return groupCatalogueRows(
        trades.filter((trade) => !exclude?.has(trade.code))
      );
    }
    const fallback: OrgTrade[] = inspectionTradeOrder
      .filter((code) => !exclude?.has(code))
      .map((code, index) => ({
        id: code,
        code,
        name: inspectionTradeLabel(code),
        groupCode: 'trades',
        sortOrder: index,
        active: true,
      }));
    return groupCatalogueRows(fallback);
  }, [trades, isError, exclude]);

  const known = useMemo(
    () => new Set(groups.flatMap((group) => group.rows.map((r) => r.code))),
    [groups]
  );
  const stray = value !== '' && !known.has(value) ? value : undefined;
  const strayRow = trades?.find((trade) => trade.code === stray);

  return (
    <select
      id={id}
      aria-label={ariaLabel}
      aria-busy={isLoading || undefined}
      className={cn(TRADE_SELECT_CLASS, className)}
      value={value}
      disabled={disabled}
      onChange={(event) => {
        const code = event.target.value;
        onChange(
          code,
          trades?.find((trade) => trade.code === code)
        );
      }}
    >
      {emptyLabel === undefined ? (
        <option value="" disabled>
          Select a trade
        </option>
      ) : (
        <option value="">{emptyLabel}</option>
      )}
      {stray !== undefined && (
        <option value={stray}>
          {inspectionTradeLabel(stray, strayRow?.name)}
          {strayRow && !strayRow.active ? ' (inactive)' : ''}
        </option>
      )}
      {groups.map((group) => (
        <optgroup
          key={group.groupCode}
          label={catalogueGroupLabel(group.groupCode)}
        >
          {group.rows.map((trade) => (
            <option key={trade.code} value={trade.code}>
              {trade.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
