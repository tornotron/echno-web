'use client';

import { Layers } from 'lucide-react';
import type { BimStoreyTile } from '@tornotron/echno-core/bim/types';
import { Checkbox } from '@/components/shadcn/checkbox';
import { cn } from '@/lib/utils/index';

interface StoreyNavigatorProps {
  storeys: BimStoreyTile[];
  /** Whether the version has a tile for products with no storey. */
  hasUnassigned: boolean;
  selected: ReadonlySet<string>;
  onToggle: (key: string, on: boolean) => void;
  onOnly: (key: string) => void;
  className?: string;
}

/** The unassigned tile's key in the selection set. */
export const UNASSIGNED_KEY = '__unassigned__';

/**
 * Storeys top down (the manifest lists them by elevation ascending). Each row
 * toggles that storey's tile; the label selects it alone.
 */
export function StoreyNavigator({
  storeys,
  hasUnassigned,
  selected,
  onToggle,
  onOnly,
  className,
}: StoreyNavigatorProps) {
  const rows = storeys.toReversed();
  return (
    <div className={cn('flex flex-col gap-1', className)} data-testid="storey-navigator">
      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
        <Layers className="size-3.5" />
        Storeys
      </div>
      {rows.length === 0 && (
        <p className="px-2 text-sm text-zinc-500">No storey tiles in this version.</p>
      )}
      {rows.map((storey) => (
        <StoreyRow
          key={storey.globalId}
          id={storey.globalId}
          label={storey.name}
          detail={
            storey.elevation === undefined
              ? undefined
              : `${storey.elevation.toFixed(2)} m`
          }
          count={storey.elementCount}
          checked={selected.has(storey.globalId)}
          onToggle={onToggle}
          onOnly={onOnly}
        />
      ))}
      {hasUnassigned && (
        <StoreyRow
          id={UNASSIGNED_KEY}
          label="Unassigned"
          detail="no storey"
          checked={selected.has(UNASSIGNED_KEY)}
          onToggle={onToggle}
          onOnly={onOnly}
        />
      )}
    </div>
  );
}

function StoreyRow({
  id,
  label,
  detail,
  count,
  checked,
  onToggle,
  onOnly,
}: {
  id: string;
  label: string;
  detail?: string;
  count?: number;
  checked: boolean;
  onToggle: (key: string, on: boolean) => void;
  onOnly: (key: string) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800',
        checked && 'bg-zinc-100 dark:bg-zinc-800'
      )}
      data-testid="storey-row"
      data-storey={id}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onToggle(id, v === true)}
        aria-label={`Show ${label}`}
      />
      <button
        type="button"
        className="flex flex-1 items-center justify-between text-left"
        onClick={() => onOnly(id)}
        title="Show only this storey"
      >
        <span className="truncate">{label}</span>
        <span className="ml-2 shrink-0 text-xs text-zinc-500">
          {count === undefined ? '' : `${count} · `}
          {detail ?? ''}
        </span>
      </button>
    </div>
  );
}
