'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/shadcn/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/shadcn/popover';

export interface MemberOption {
  id: number;
  label: string;
  sublabel?: string;
}

/** A member held some other way, shown as a muted chip that cannot be removed here. */
export interface IndirectMember {
  id: number;
  label: string;
  /** e.g. "through Project Manager". */
  reason: string;
}

interface MemberChipsProps {
  /** Row label, e.g. "Members". */
  label: string;
  /** Plural noun for the picker, e.g. "users". */
  noun: string;
  options: MemberOption[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  indirect?: IndirectMember[];
  disabled?: boolean;
}

/** The current set as removable chips, and an Add button with a searchable picker. */
export function MemberChips({
  label,
  noun,
  options,
  selectedIds,
  onChange,
  indirect = [],
  disabled,
}: MemberChipsProps) {
  const [open, setOpen] = useState(false);
  const byId = new Map(options.map((o) => [o.id, o]));
  const selected = new Set(selectedIds);
  const indirectIds = new Set(indirect.map((m) => m.id));
  const addable = options.filter((o) => !selected.has(o.id));

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
      <span className="w-20 shrink-0 pt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {selectedIds.length === 0 && indirect.length === 0 && (
          <span className="pt-0.5 text-sm text-zinc-400">None</span>
        )}
        {selectedIds.map((id) => {
          const o = byId.get(id);
          if (!o) return null;
          return (
            <span
              key={id}
              title={o.sublabel}
              className="inline-flex h-7 items-center gap-1 rounded-full border bg-white pr-1 pl-2.5 text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
            >
              {o.label}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onChange(selectedIds.filter((x) => x !== id))}
                  className="rounded-full p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                  aria-label={`Remove ${o.label}`}
                >
                  <X className="size-3.5" />
                </button>
              )}
            </span>
          );
        })}
        {indirect
          .filter((m) => !selected.has(m.id))
          .map((m) => (
            <span
              key={`indirect-${m.id}`}
              title={m.reason}
              className="inline-flex h-7 items-center rounded-full border border-dashed px-2.5 text-sm text-zinc-500 dark:text-zinc-400"
            >
              {m.label}
              <span className="ml-1 text-xs text-zinc-400">· {m.reason}</span>
            </span>
          ))}
        {!disabled && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-full px-2.5 text-zinc-600 dark:text-zinc-300"
                disabled={addable.length === 0}
              >
                <Plus className="mr-1 size-3.5" />
                Add
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput placeholder={`Search ${noun}…`} />
                <CommandList>
                  <CommandEmpty>No {noun} found.</CommandEmpty>
                  <CommandGroup>
                    {addable.map((o) => (
                      <CommandItem
                        key={o.id}
                        value={`${o.label} ${o.sublabel ?? ''} ${o.id}`}
                        onSelect={() => {
                          onChange([...selectedIds, o.id]);
                          setOpen(false);
                        }}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm">{o.label}</p>
                          {(o.sublabel || indirectIds.has(o.id)) && (
                            <p className="truncate text-xs text-zinc-500">
                              {indirectIds.has(o.id)
                                ? 'Already in, through a role'
                                : o.sublabel}
                            </p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
