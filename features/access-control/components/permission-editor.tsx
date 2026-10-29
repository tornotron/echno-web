'use client';

import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn/dropdown-menu';
import {
  actionLabel,
  setCell,
  withActions,
  type AccessCatalog,
  type EffectiveAccess,
  type PermissionMap,
} from '@/types/access-control';
import { areaIcon } from '../lib/module-icons';
import { ActionSelect } from './action-select';

/** The "Set all" shortcuts, broadest last. An area gets the ones it has. */
const PRESETS: { label: string; actions: string[] }[] = [
  { label: 'No access', actions: [] },
  { label: 'View only', actions: ['view'] },
  { label: 'View and create', actions: ['view', 'create'] },
  { label: 'View and approve', actions: ['view', 'approve'] },
  { label: 'View, create and edit', actions: ['view', 'create', 'edit'] },
  {
    label: 'View, create, edit and approve',
    actions: ['view', 'create', 'edit', 'approve'],
  },
  {
    label: 'Full access',
    actions: ['view', 'create', 'edit', 'approve', 'delete'],
  },
];

/** "No access", "Full access", or the actions by name: "View, Edit". */
function describeActions(
  actions: readonly string[],
  all: readonly string[]
): string {
  if (actions.length === 0) return 'No access';
  if (actions.length === all.length) return 'Full access';
  return actions.map((a) => actionLabel(a)).join(', ');
}

interface PermissionEditorProps {
  catalog: AccessCatalog;
  permissions: PermissionMap;
  onChange: (next: PermissionMap) => void;
  readOnly?: boolean;
  /** Actions per area that cannot be taken away. */
  locked?: Record<string, string[]>;
  /**
   * What the subject already gets elsewhere, per area. A person's editor
   * passes their roles and groups here: those actions show ticked and
   * disabled, and their own grant only needs to cover the gap.
   */
  inherited?: Record<string, EffectiveAccess>;
  /** Prefixes each dropdown's accessible name, e.g. the role's name. */
  subject: string;
}

/** Areas grouped by section, each with its actions and scope in one dropdown. */
export function PermissionEditor({
  catalog,
  permissions,
  onChange,
  readOnly,
  locked = {},
  inherited,
  subject,
}: PermissionEditorProps) {
  const setAll = (areaIds: string[], actions: string[]) => {
    let next = permissions;
    for (const area of catalog.areas) {
      if (!areaIds.includes(area.id)) continue;
      const wanted = [
        ...(locked[area.id] ?? []),
        ...actions.filter((a) => area.actions.includes(a)),
      ];
      next = setCell(
        next,
        area.id,
        withActions(area, permissions[area.id], wanted)
      );
    }
    onChange(next);
  };

  return (
    <div className="space-y-5">
      {catalog.sections.map((section) => {
        const areas = catalog.areas.filter((a) => a.section === section);
        if (areas.length === 0) return null;
        const headingId = `perm-${section.toLowerCase().replaceAll(/\W+/g, '-')}`;
        return (
          <section key={section} aria-labelledby={headingId}>
            <div className="mb-1 flex items-center justify-between">
              <h4
                id={headingId}
                className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
              >
                {section}
              </h4>
              {!readOnly && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-zinc-500"
                    >
                      Set all
                      <ChevronDown className="ml-1 size-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {PRESETS.map((p) => (
                      <DropdownMenuItem
                        key={p.label}
                        onSelect={() =>
                          setAll(
                            areas.map((a) => a.id),
                            p.actions
                          )
                        }
                      >
                        {p.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <ul className="divide-y divide-zinc-100 rounded-lg border dark:divide-zinc-800">
              {areas.map((area) => {
                const Icon = areaIcon(area.id);
                const from = inherited?.[area.id];
                const fromNames = from?.sources.map((s) => s.name).join(', ');
                return (
                  <li
                    key={area.id}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Icon className="size-4 shrink-0 text-zinc-500" />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                          {area.label}
                        </p>
                        {from && from.actions.length > 0 && (
                          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {describeActions(from.actions, area.actions)} from{' '}
                            {fromNames}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="w-48 shrink-0">
                      <ActionSelect
                        area={area}
                        value={permissions[area.id]}
                        scopes={catalog.scopes}
                        onChange={(cell) =>
                          onChange(setCell(permissions, area.id, cell))
                        }
                        locked={locked[area.id]}
                        inherited={from?.actions}
                        inheritedFrom={fromNames}
                        disabled={readOnly}
                        ariaLabel={`${subject}: ${area.label}`}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
