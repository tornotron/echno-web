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
import { cn } from '@/lib/utils';
import {
  actionDescription,
  actionLabel,
  cellActions,
  cellScope,
  normalizeActions,
  scopeDescription,
  scopeLabel,
  withActions,
  withScope,
  type AccessArea,
  type AreaGrants,
} from '@/types/access-control';

/** The common combinations, offered under Custom below the action checkboxes. */
const PRESETS: { label: string; actions: string[] }[] = [
  { label: 'No Access', actions: [] },
  { label: 'View', actions: ['view'] },
  { label: 'View + Create', actions: ['view', 'create'] },
  { label: 'View + Approve', actions: ['view', 'approve'] },
  { label: 'Edit', actions: ['view', 'create', 'edit'] },
  { label: 'Edit + Approve', actions: ['view', 'create', 'edit', 'approve'] },
  {
    label: 'Full',
    actions: ['view', 'create', 'edit', 'approve', 'delete'],
  },
];

const sameActions = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

/** "Full", "Edit", "View + Delete", "V · E · A": the actions part of a cell's text. */
export function actionsLabel(
  area: Pick<AccessArea, 'actions'>,
  actions: readonly string[]
): string {
  if (actions.length > 0 && actions.length === area.actions.length)
    return 'Full';
  const preset = PRESETS.find((p) => sameActions(p.actions, actions));
  if (preset) return preset.label;
  if (actions.length === 2)
    return actions.map((a) => actionLabel(a)).join(' + ');
  return actions.map((a) => actionLabel(a)[0]).join(' · ');
}

/** "Edit · Assigned projects", or "No Access". */
export function cellLabel(
  area: Pick<AccessArea, 'actions'>,
  actions: readonly string[],
  scope: string | undefined
): string {
  const text = actionsLabel(area, actions);
  if (!scope || actions.length === 0) return text;
  return `${text} · ${scope === 'MIXED' ? 'Mixed' : scopeLabel(scope)}`;
}

/** Cell colour: red for none, blue for read-only, green for everything, amber between. */
function toneOf(actions: readonly string[], all: number): string {
  if (actions.length === 0)
    return 'border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400';
  if (actions.length === all)
    return 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400';
  if (actions.length === 1)
    return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400';
  return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-400';
}

interface ActionSelectProps {
  area: AccessArea;
  /** The actions held, each with its scope. */
  value: AreaGrants | undefined;
  onChange: (cell: AreaGrants) => void;
  /** The catalog's scopes, widest first. */
  scopes: readonly string[];
  disabled?: boolean;
  /** e.g. "Project Manager: Finance". */
  ariaLabel: string;
  /** Actions that cannot be taken away; ticked and disabled, and they fix the scope. */
  locked?: readonly string[];
  /**
   * Actions granted elsewhere (a person's roles and groups). The chip shows
   * them together with `value`; in the menu they are ticked and disabled.
   */
  inherited?: readonly string[];
  /** Says where `inherited` comes from, for the disabled rows. */
  inheritedFrom?: string;
}

/**
 * A coloured dropdown for one area: tick the area's actions one by one, or
 * pick one of the Custom combinations below them, and pick the scope they
 * cover. The Scope section appears once the cell holds an action, and the
 * menu stays open after a choice so the scope can be set next. As everywhere, any
 * action brings View with it and clearing View clears the rest, except what
 * is locked.
 */
export function ActionSelect({
  area,
  value,
  onChange,
  scopes,
  disabled,
  ariaLabel,
  locked = [],
  inherited = [],
  inheritedFrom,
}: ActionSelectProps) {
  const held = cellActions(area, value);
  const shown = normalizeActions(area, [...held, ...inherited]);
  const scope = cellScope(value);
  const hasInherited = inherited.length > 0;
  const fullyLocked = held.length > 0 && held.every((a) => locked.includes(a));
  const presets = PRESETS.filter((p) =>
    p.actions.every((a) => area.actions.includes(a))
  );

  const set = (actions: readonly string[]) =>
    onChange(withActions(area, value, [...locked, ...actions]));

  const toggle = (action: string, on: boolean) => {
    if (action === 'view' && !on) return set([]);
    set(on ? [...held, action] : held.filter((a) => a !== action));
  };

  const label = cellLabel(area, shown, scope);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        aria-label={`${ariaLabel}: ${label}`}
        className={cn(
          'flex h-7 w-full min-w-24 items-center justify-between gap-1 rounded-md border px-2 text-xs font-medium whitespace-nowrap',
          'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:cursor-default',
          toneOf(shown, area.actions.length)
        )}
      >
        <span className="flex min-w-0 items-center gap-1">
          {fullyLocked && (
            <Lock className="size-3 shrink-0" aria-label="Locked" />
          )}
          <span className="truncate">{label}</span>
        </span>
        {!disabled && <ChevronDown className="size-3 shrink-0 opacity-60" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56">
        {area.actions.map((action) => {
          const isLocked = locked.includes(action);
          const isInherited = inherited.includes(action);
          return (
            <DropdownMenuCheckboxItem
              key={action}
              checked={isLocked || isInherited || held.includes(action)}
              disabled={isLocked || isInherited}
              title={
                isLocked
                  ? 'Everyone keeps this; it cannot be taken away'
                  : isInherited
                    ? `Already granted${inheritedFrom ? ` by ${inheritedFrom}` : ''}`
                    : actionDescription(action)
              }
              // Stay open so several actions can be ticked in a row.
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={(on) => toggle(action, on === true)}
              className="text-xs"
            >
              {actionLabel(action)}
              {(isLocked || isInherited) && (
                <span className="ml-auto text-[10px] text-zinc-400">
                  {isLocked ? 'locked' : 'inherited'}
                </span>
              )}
            </DropdownMenuCheckboxItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-zinc-500">
          Custom
        </DropdownMenuLabel>
        {presets.map((p, i) => (
          <DropdownMenuItem
            key={p.label}
            // Stay open: the Scope section appears after a pick and hides
            // again after No Access.
            onSelect={(e) => {
              e.preventDefault();
              set(p.actions);
            }}
            className={cn(
              'text-xs',
              sameActions(p.actions, held) && 'font-semibold'
            )}
          >
            {/* For a person, the first preset clears only their extra grants. */}
            {i === 0 && hasInherited ? 'Nothing extra' : p.label}
          </DropdownMenuItem>
        ))}
        {area.actions.length > 5 && (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              set(area.actions);
            }}
            className={cn(
              'text-xs',
              sameActions(area.actions, held) && 'font-semibold'
            )}
          >
            Everything
          </DropdownMenuItem>
        )}
        {held.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-zinc-500">
              Scope
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={scope === 'MIXED' ? '' : (scope ?? '')}
              onValueChange={(s) => value && onChange(withScope(value, s))}
            >
              {scopes.map((s) => (
                <DropdownMenuRadioItem
                  key={s}
                  value={s}
                  disabled={locked.length > 0}
                  title={
                    locked.length > 0
                      ? 'Fixed by the locked actions'
                      : scopeDescription(s)
                  }
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
