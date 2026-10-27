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
  ACCESS_ACTIONS,
  ACCESS_ACTION_LABELS,
  ACCESS_MODULES,
  ACCESS_MODULE_SECTIONS,
  type AccessAction,
  type AccessModuleId,
  type EffectiveAccess,
  type PermissionMap,
} from '@/types/access-control';
import { ACCESS_MODULE_ICONS } from '../lib/module-icons';
import { ActionSelect } from './action-select';

/** The "Set all" shortcuts, broadest last. */
const PRESETS: { label: string; actions: AccessAction[] }[] = [
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
function describeActions(actions: readonly AccessAction[]): string {
  if (actions.length === 0) return 'No access';
  if (actions.length === ACCESS_ACTIONS.length) return 'Full access';
  return actions.map((a) => ACCESS_ACTION_LABELS[a]).join(', ');
}

interface PermissionEditorProps {
  permissions: PermissionMap;
  onChange: (next: PermissionMap) => void;
  readOnly?: boolean;
  /**
   * What the subject already gets elsewhere, per module. A user's editor
   * passes their roles and groups here: those actions show ticked and
   * locked, and the direct grant only needs to cover the gap.
   */
  inherited?: Record<AccessModuleId, EffectiveAccess>;
  /** Prefixes each dropdown's accessible name, e.g. the role's name. */
  subject: string;
}

/** Modules grouped by section, each with a View / Create / Edit / Approve / Delete dropdown. */
export function PermissionEditor({
  permissions,
  onChange,
  readOnly,
  inherited,
  subject,
}: PermissionEditorProps) {
  const set = (ids: AccessModuleId[], actions: AccessAction[]) => {
    const next = { ...permissions };
    for (const id of ids) {
      if (actions.length > 0) next[id] = actions;
      else delete next[id];
    }
    onChange(next);
  };

  return (
    <div className="space-y-5">
      {ACCESS_MODULE_SECTIONS.map((section) => {
        const modules = ACCESS_MODULES.filter((m) => m.section === section.id);
        const ids = modules.map((m) => m.id);
        return (
          <section key={section.id} aria-labelledby={`perm-${section.id}`}>
            <div className="mb-1 flex items-center justify-between">
              <h4
                id={`perm-${section.id}`}
                className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400"
              >
                {section.label}
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
                        onSelect={() => set(ids, p.actions)}
                      >
                        {p.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <ul className="divide-y divide-zinc-100 rounded-lg border dark:divide-zinc-800">
              {modules.map((module) => {
                const Icon = ACCESS_MODULE_ICONS[module.id];
                const from = inherited?.[module.id];
                const fromNames = from?.sources.map((s) => s.name).join(', ');
                return (
                  <li
                    key={module.id}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Icon className="size-4 shrink-0 text-zinc-500" />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">
                          {module.label}
                        </p>
                        {from && from.actions.length > 0 && (
                          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {describeActions(from.actions)} from {fromNames}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="w-36 shrink-0">
                      <ActionSelect
                        value={permissions[module.id] ?? []}
                        onChange={(actions) => set([module.id], actions)}
                        inherited={from?.actions}
                        inheritedFrom={fromNames}
                        disabled={readOnly}
                        ariaLabel={`${subject}: ${module.label}`}
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
