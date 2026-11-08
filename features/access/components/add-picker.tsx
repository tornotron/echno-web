'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
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

export interface PickerOption<Id extends string | number> {
  id: Id;
  label: string;
  sublabel?: string;
}

interface AddPickerProps<Id extends string | number> {
  /** The button's text, e.g. "Add person". */
  label: string;
  /** Plural noun for the search box, e.g. "people". */
  noun: string;
  options: PickerOption<Id>[];
  onPick: (id: Id) => void;
  disabled?: boolean;
}

/** An Add button that opens a searchable list and hands back the one picked. */
export function AddPicker<Id extends string | number>({
  label,
  noun,
  options,
  onPick,
  disabled,
}: AddPickerProps<Id>) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          disabled={disabled || options.length === 0}
        >
          <Plus className="mr-1 size-3.5" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${noun}`} />
          <CommandList>
            <CommandEmpty>No {noun} found.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={`${o.label} ${o.sublabel ?? ''} ${o.id}`}
                  onSelect={() => {
                    onPick(o.id);
                    setOpen(false);
                  }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{o.label}</p>
                    {o.sublabel && (
                      <p className="truncate text-xs text-zinc-500">
                        {o.sublabel}
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
  );
}
