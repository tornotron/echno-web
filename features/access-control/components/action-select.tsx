'use client';

import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  ACCESS_ACTIONS,
  ACCESS_ACTION_DESCRIPTIONS,
  ACCESS_ACTION_LABELS,
  normalizeActions,
  type AccessAction,
} from '@/types/access-control';

/** The common combinations, offered first; anything else is built from the checkboxes. */
const PRESETS: { label: string; actions: AccessAction[] }[] = [
  { label: 'No Access', actions: [] },
  { label: 'View', actions: ['view'] },
  { label: 'View + Create', actions: ['view', 'create'] },
  { label: 'Edit', actions: ['view', 'create', 'edit'] },
  { label: 'Full', actions: ['view', 'create', 'edit', 'delete'] },
];

const sameActions = (a: readonly AccessAction[], b: readonly AccessAction[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

/** "Full", "Edit", "View + Delete", "V · E · D": the cell's text. */
export function actionsLabel(actions: readonly AccessAction[]): string {
  const preset = PRESETS.find((p) => sameActions(p.actions, actions));
  if (preset) return preset.label;
  if (actions.length === 2) {
    return actions.map((a) => ACCESS_ACTION_LABELS[a]).join(' + ');
  }
  return actions.map((a) => ACCESS_ACTION_LABELS[a][0]).join(' · ');
}

/** Cell colour: red for none, blue for read-only, green for everything, amber between. */
function toneOf(actions: readonly AccessAction[]): string {
  if (actions.length === 0)
    return 'border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400';
  if (actions.length === ACCESS_ACTIONS.length)
    return 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400';
  if (actions.length === 1)
    return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400';
  return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-400';
}

interface ActionSelectProps {
  value: AccessAction[];
  onChange: (actions: AccessAction[]) => void;
  disabled?: boolean;
  /** e.g. "Project Manager: Finance". */
  ariaLabel: string;
  /**
   * Actions granted elsewhere (a user's roles and groups). The chip shows
   * them together with `value`; in the menu they are ticked and locked.
   */
  inherited?: AccessAction[];
  /** Says where `inherited` comes from, for the locked rows. */
  inheritedFrom?: string;
}

/**
 * A coloured dropdown for one permission: pick a preset, or tick View,
 * Create, Edit and Delete one by one. As everywhere, any action brings
 * View with it and clearing View clears the rest.
 */
export function ActionSelect({
  value,
  onChange,
  disabled,
  ariaLabel,
  inherited = [],
  inheritedFrom,
}: ActionSelectProps) {
  const shown = normalizeActions([...value, ...inherited]);
  const hasInherited = inherited.length > 0;

  const toggle = (action: AccessAction, on: boolean) => {
    if (action === 'view' && !on) return onChange([]);
    const next = on ? [...value, action] : value.filter((a) => a !== action);
    onChange(normalizeActions(next));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        aria-label={`${ariaLabel}: ${actionsLabel(shown)}`}
        className={cn(
          'flex h-7 w-full min-w-24 items-center justify-between gap-1 rounded-md border px-2 text-xs font-medium whitespace-nowrap',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:cursor-default',
          toneOf(shown)
        )}
      >
        <span className="truncate">{actionsLabel(shown)}</span>
        {!disabled && <ChevronDown className="size-3 shrink-0 opacity-60" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-52">
        {PRESETS.map((p, i) => (
          <DropdownMenuItem
            key={p.label}
            onSelect={() => onChange(p.actions)}
            className={cn(
              'text-xs',
              sameActions(p.actions, value) && 'font-semibold'
            )}
          >
            {/* For a user, the first preset clears only their extra grants. */}
            {i === 0 && hasInherited ? 'Nothing extra' : p.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-zinc-500">
          Custom
        </DropdownMenuLabel>
        {ACCESS_ACTIONS.map((action) => {
          const locked = inherited.includes(action);
          return (
            <DropdownMenuCheckboxItem
              key={action}
              checked={locked || value.includes(action)}
              disabled={locked}
              title={
                locked
                  ? `Already granted${inheritedFrom ? ` by ${inheritedFrom}` : ''}`
                  : ACCESS_ACTION_DESCRIPTIONS[action]
              }
              // Stay open so several actions can be ticked in a row.
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={(on) => toggle(action, on === true)}
              className="text-xs"
            >
              {ACCESS_ACTION_LABELS[action]}
              {locked && (
                <span className="ml-auto text-[10px] text-zinc-400">
                  inherited
                </span>
              )}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
