'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Textarea } from '@/components/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Loader2 } from 'lucide-react';
import {
  useCreateAccount,
  useUpdateAccount,
} from '@tornotron/echno-core/finance/hooks';
import {
  AccountType,
  type AccountTreeNode,
} from '@tornotron/echno-core/finance/types';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { toast } from '@/lib/styles/toast-styles';
import { required } from '@/lib/validators';
import {
  collectSubtreeIds,
  flattenAccountTree,
  type FlatAccountNode,
} from '../utils/account-tree';

const NO_PARENT = 'none';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.ASSET]: 'Asset',
  [AccountType.LIABILITY]: 'Liability',
  [AccountType.EQUITY]: 'Equity',
  [AccountType.INCOME]: 'Income',
  [AccountType.EXPENSE]: 'Expense',
};

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The whole tree, used to build the parent picker. */
  tree: AccountTreeNode[];
  /** When set, the dialog edits this account; otherwise it creates one. */
  account?: AccountTreeNode | null;
  /** Pre-selected parent id when adding a sub-account under a node. */
  defaultParentId?: string | null;
}

export function AccountFormDialog({
  open,
  onOpenChange,
  tree,
  account,
  defaultParentId,
}: AccountFormDialogProps) {
  const isEdit = Boolean(account);
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const isPending = createAccount.isPending || updateAccount.isPending;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>(AccountType.ASSET);
  const [parentId, setParentId] = useState<string>(NO_PARENT);
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Re-seed the form whenever the dialog is (re)opened for a given target.
  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (account) {
      setCode(account.code);
      setName(account.name);
      setType(account.type);
      setParentId(defaultParentId ?? NO_PARENT);
      setDescription(account.description ?? '');
      setActive(account.active);
    } else {
      setCode('');
      setName('');
      setType(AccountType.ASSET);
      setParentId(defaultParentId ?? NO_PARENT);
      setDescription('');
      setActive(true);
    }
  }, [open, account, defaultParentId]);

  // Parent options exclude the account itself and its descendants so an account
  // can never be reparented beneath its own subtree.
  const parentOptions = useMemo<FlatAccountNode[]>(() => {
    const excluded = account ? collectSubtreeIds(account) : new Set<string>();
    return flattenAccountTree(tree).filter((row) => !excluded.has(row.node.id));
  }, [tree, account]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    const codeError = required('Code')(code);
    if (codeError) next.code = codeError;
    const nameError = required('Name')(name);
    if (nameError) next.name = nameError;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) {
      toast.error('Validation Error', {
        description: 'Please fix the errors in the form',
      });
      return;
    }

    const resolvedParentId = parentId === NO_PARENT ? null : parentId;

    if (account) {
      updateAccount.mutate(
        {
          id: account.id,
          data: {
            code: code.trim(),
            name: name.trim(),
            active,
            description: description.trim() || null,
            parentId: resolvedParentId,
          },
        },
        {
          onSuccess: () => {
            toast.success('Account updated', {
              description: `${code.trim()} · ${name.trim()}`,
            });
            onOpenChange(false);
          },
          onError: (error) =>
            toast.error(getErrorTitle(error, 'Update failed'), {
              description: getErrorMessage(error),
            }),
        }
      );
      return;
    }

    createAccount.mutate(
      {
        code: code.trim(),
        name: name.trim(),
        type,
        parentId: resolvedParentId ?? undefined,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Account created', {
            description: `${code.trim()} · ${name.trim()}`,
          });
          onOpenChange(false);
        },
        onError: (error) =>
          toast.error(getErrorTitle(error, 'Create failed'), {
            description: getErrorMessage(error),
          }),
      }
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit account' : 'New account'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the account code, name, parent, or status.'
              : 'Add a ledger account to the chart of accounts.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="account-form"
          onSubmit={handleSubmit}
          className="space-y-4 py-1"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-code">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="account-code"
                placeholder="e.g. 1100"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={errors.code ? 'border-red-500' : ''}
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-type">
                Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as AccountType)}
                disabled={isEdit}
              >
                <SelectTrigger id="account-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AccountType).map((value) => (
                    <SelectItem key={value} value={value}>
                      {ACCOUNT_TYPE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEdit && (
                <p className="text-muted-foreground text-xs">
                  The account type cannot be changed after creation.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="account-name"
              placeholder="e.g. Accounts Receivable"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-parent">
              Parent{' '}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger id="account-parent">
                <SelectValue placeholder="No parent (root)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PARENT}>No parent (root)</SelectItem>
                {parentOptions.map(({ node, depth }) => (
                  <SelectItem key={node.id} value={node.id}>
                    {' '.repeat(depth * 2)}
                    {node.code} · {node.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="account-status">Status</Label>
              <Select
                value={active ? 'active' : 'inactive'}
                onValueChange={(value) => setActive(value === 'active')}
              >
                <SelectTrigger id="account-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="account-description">
              Description{' '}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="account-description"
              placeholder="What this account is used for"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="account-form" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
