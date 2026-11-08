'use client';

import { ChevronDown, Lock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import type { AccessArea } from '@tornotron/echno-core/access/types';
import { cn } from '@/lib/utils';
import {
  actionDescription,
  actionLabel,
  cellLabel,
  PRESETS,
  scopeDescription,
  scopeLabel,
} from '../lib/labels';
import {
  cellScope,
  shownActions,
  withChosen,
  withScope,
  type AreaGrants,
} from '../lib/permissions';

/** Cell colour: red for none, blue for one action, green for everything shown, amber between. */
function toneOf(actions: readonly string[], all: number): string {
  if (actions.length === 0)
    return 'border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400';
  if (actions.length === all)
    return 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400';
  if (actions.length === 1)
    return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400';
  return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-400';
}

const sameActions = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

interface ActionSelectProps {
  area: AccessArea;
  /** The actions held, each with its scope. */
  value: AreaGrants | undefined;
  onChange: (cell: AreaGrants) => void;
  /**
   * The actions the caller may switch on or off here: enforced, and held by
   * the caller. Others show ticked and disabled when held, and are kept.
   */
  offered: readonly string[];
  /** The scopes the backend filters this area by: every scope, or only All. */
  scopes: readonly string[];
  disabled?: boolean;
  /** e.g. "Project Manager: Finance". */
  ariaLabel: string;
}

/**
 * A coloured dropdown for one area: tick its actions one by one, or pick a
 * combination below them, and pick the scope they cover. Only the actions
 * the backend enforces are listed, and only the scopes it filters by. The
 * menu stays open after a choice so the scope can be set next. Any action
 * brings Read with it, and clearing Read clears the rest.
 */
export function ActionSelect({
  area,
  value,
  onChange,
  offered,
  scopes,
  disabled,
  ariaLabel,
}: ActionSelectProps) {
  const shown = shownActions(area, value);
  const heldOffered = shown.filter((a) => offered.includes(a));
  const fixed = shown.filter((a) => !offered.includes(a));
  const scope = cellScope(value, shown);
  const editableScope = cellScope(value, heldOffered);
  const presets = PRESETS.filter((p) =>
    p.actions.every((a) => offered.includes(a))
  );
  const inactive = disabled || offered.length === 0;

  const set = (actions: readonly string[]) =>
    onChange(withChosen(area, value, actions, offered, scopes[0]));

  const toggle = (action: string, on: boolean) => {
    if (action === 'read' && !on) return set([]);
    set(
      on ? [...heldOffered, action] : heldOffered.filter((a) => a !== action)
    );
  };

  const label = cellLabel(area.enforcedActions, shown, scope);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={inactive}
        aria-label={`${ariaLabel}: ${label}`}
        className={cn(
          'flex h-7 w-full min-w-24 items-center justify-between gap-1 rounded-md border px-2 text-xs font-medium whitespace-nowrap',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:cursor-default',
          toneOf(shown, area.enforcedActions.length)
        )}
      >
        <span className="flex min-w-0 items-center gap-1">
          {fixed.length > 0 && heldOffered.length === 0 && !disabled && (
            <Lock className="size-3 shrink-0" aria-label="Fixed" />
          )}
          <span className="truncate">{label}</span>
        </span>
        {!inactive && <ChevronDown className="size-3 shrink-0 opacity-60" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56">
        {area.enforcedActions.map((action) => {
          const isFixed = !offered.includes(action);
          return (
            <DropdownMenuCheckboxItem
              key={action}
              checked={shown.includes(action)}
              disabled={isFixed}
              title={
                isFixed
                  ? 'You can only give or take away access you hold yourself'
                  : actionDescription(action)
              }
              // Stay open so several actions can be ticked in a row.
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={(on) => toggle(action, on === true)}
              className="text-xs"
            >
              {actionLabel(action)}
            </DropdownMenuCheckboxItem>
          );
        })}
        {presets.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-zinc-500">
              Combinations
            </DropdownMenuLabel>
            {presets.map((p) => (
              <DropdownMenuItem
                key={p.label}
                // Stay open: the Scope section appears after a pick and
                // hides again after No Access.
                onSelect={(e) => {
                  e.preventDefault();
                  set(p.actions);
                }}
                className={cn(
                  'text-xs',
                  sameActions(p.actions, heldOffered) && 'font-semibold'
                )}
              >
                {p.label}
              </DropdownMenuItem>
            ))}
          </>
        )}
        {heldOffered.length > 0 && scopes.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-zinc-500">
              Scope
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={editableScope === 'MIXED' ? '' : (editableScope ?? '')}
              onValueChange={(s) =>
                value && onChange(withScope(value, offered, s))
              }
            >
              {scopes.map((s) => (
                <DropdownMenuRadioItem
                  key={s}
                  value={s}
                  title={scopeDescription(s)}
                  onSelect={(e) => e.preventDefault()}
                  className="text-xs"
                >
                  {scopeLabel(s)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
