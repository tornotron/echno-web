'use client';

import { useState } from 'react';
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
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils/index';
import type { AccountTreeNode } from '@tornotron/echno-core/finance/types';

interface AccountComboboxProps {
  accounts: AccountTreeNode[];
  value?: string;
  onSelect: (accountId: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Searchable picker over a flat list of ledger accounts, showing each account's
 * code and name. Both the posting-account mapping in finance settings and the
 * expense-account field on a cost category need it, which is why it sits in
 * `components/shared` rather than inside either feature.
 *
 * @param props.accounts - Accounts to offer, already narrowed by the caller.
 * @param props.value - Id of the selected account.
 * @param props.onSelect - Receives the id of the account chosen.
 * @param props.disabled - Disables the trigger.
 * @param props.placeholder - Shown when nothing is selected.
 */
export function AccountCombobox({
  accounts,
  value,
  onSelect,
  disabled,
  placeholder = 'Select account',
}: AccountComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = accounts.find((account) => account.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal sm:w-[280px]"
        >
          <span className="truncate">
            {selected ? (
              <>
                <span className="font-mono">{selected.code}</span>{' '}
                {selected.name}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command
          filter={(itemValue, search) =>
            itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder="Search accounts..." />
          <CommandList>
            <CommandEmpty>No postable account found.</CommandEmpty>
            <CommandGroup>
              {accounts.map((account) => (
                <CommandItem
                  key={account.id}
                  value={`${account.code} ${account.name}`}
                  onSelect={() => {
                    onSelect(account.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === account.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="font-mono text-xs">{account.code}</span>
                  <span className="ml-2 truncate">{account.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
