'use client';

import { useMemo } from 'react';
import {
  catalogueGroupLabel,
  groupCatalogueRows,
} from '@tornotron/echno-core/inspection/types';
import { useOrgElementTypes } from '@tornotron/echno-core/inspection/hooks';
import { Checkbox } from '@/components/shadcn/checkbox';
import { cn } from '@/lib/utils/index';
import { TRADE_SELECT_CLASS } from './trade-picker';

interface ElementTypeSelectProps {
  /** The selected element type code, or empty for none. */
  value: string;
  onChange: (code: string) => void;
  /** Rendered first with an empty-string value, e.g. "Any element type". */
  emptyLabel: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

/** A single element type picker driven by the organization's list. */
export function ElementTypeSelect({
  value,
  onChange,
  emptyLabel,
  id,
  disabled,
  className,
  'aria-label': ariaLabel,
}: ElementTypeSelectProps) {
  const { data: types = [] } = useOrgElementTypes();
  const groups = useMemo(() => groupCatalogueRows(types), [types]);

  return (
    <select
      id={id}
      aria-label={ariaLabel}
      className={cn(TRADE_SELECT_CLASS, className)}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{emptyLabel}</option>
      {groups.map((group) => (
        <optgroup
          key={group.groupCode}
          label={catalogueGroupLabel(group.groupCode)}
        >
          {group.rows.map((type) => (
            <option key={type.code} value={type.code}>
              {type.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

interface ElementTypeMultiPickerProps {
  /** Selected codes. Empty means "any". */
  value: readonly string[];
  onChange: (codes: string[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * A checkbox list of the organization's element types, grouped, for a
 * template's applicability. Nothing ticked means the template suits any
 * element.
 */
export function ElementTypeMultiPicker({
  value,
  onChange,
  disabled,
  className,
}: ElementTypeMultiPickerProps) {
  const { data: types = [], isLoading } = useOrgElementTypes();
  const groups = useMemo(() => groupCatalogueRows(types), [types]);
  const selected = new Set(value);

  const toggle = (code: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(code);
    else next.delete(code);
    // The organization's order for known codes, then any selected code the
    // list no longer holds (an inactive type), which stays until unticked.
    const known = groups.flatMap((g) => g.rows.map((r) => r.code));
    onChange([
      ...known.filter((c) => next.has(c)),
      ...[...next].filter((c) => !known.includes(c)),
    ]);
  };

  if (!isLoading && types.length === 0) {
    return (
      <p className={cn('text-muted-foreground text-xs', className)}>
        No element types defined yet. Add them under Element types.
      </p>
    );
  }

  return (
    <div
      className={cn('space-y-3', className)}
      aria-busy={isLoading || undefined}
    >
      {groups.map((group) => (
        <div key={group.groupCode} className="space-y-1.5">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            {catalogueGroupLabel(group.groupCode)}
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {group.rows.map((type) => {
              const inputId = `element-type-${type.code}`;
              return (
                <label
                  key={type.code}
                  htmlFor={inputId}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    id={inputId}
                    checked={selected.has(type.code)}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      toggle(type.code, checked === true)
                    }
                  />
                  {type.name}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
