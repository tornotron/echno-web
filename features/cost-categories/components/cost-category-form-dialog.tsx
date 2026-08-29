'use client';

import { useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { Loader2, X } from 'lucide-react';
import {
  useCreateCostCategory,
  useUpdateCostCategory,
  useFinanceAccountTree,
} from '@tornotron/echno-core/finance/hooks';
import {
  AccountType,
  type CostCategory,
} from '@tornotron/echno-core/finance/types';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { toast } from '@/lib/styles/toast-styles';
import { required } from '@/lib/validators';
import { collectPostableAccounts } from '@/lib/finance/account-tree';
import { AccountCombobox } from '@/components/shared/account-combobox';

interface CostCategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this category; otherwise it creates one. */
  category?: CostCategory | null;
}

export function CostCategoryFormDialog({
  open,
  onOpenChange,
  category,
}: CostCategoryFormDialogProps) {
  const isEdit = Boolean(category);
  const createCategory = useCreateCostCategory();
  const updateCategory = useUpdateCostCategory();
  const isPending = createCategory.isPending || updateCategory.isPending;

  const { data: tree = [] } = useFinanceAccountTree();
  // Cost categories bind to an expense ledger account, so the picker only offers
  // postable accounts of type EXPENSE.
  const expenseAccounts = useMemo(
    () =>
      collectPostableAccounts(tree).filter(
        (account) => account.type === AccountType.EXPENSE
      ),
    [tree]
  );

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState<string | null>(null);
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Re-seed the form whenever the dialog is (re)opened for a given target.
  //
  // Done while rendering rather than in an effect: an effect would paint the
  // previous category's values first and only then replace them, which is a
  // cascading render and, on a dialog, a visible flicker of the last category
  // edited. Clearing the key on close is what lets the same category be
  // re-seeded when the dialog is opened again.
  const seedKey = category?.id ?? 'new';
  const [seededFor, setSeededFor] = useState<string | null>(null);

  if (!open && seededFor !== null) {
    setSeededFor(null);
  }
  if (open && seededFor !== seedKey) {
    setSeededFor(seedKey);
    setErrors({});
    setName(category?.name ?? '');
    setCode(category?.code ?? '');
    setExpenseAccountId(category?.expenseAccountId ?? null);
    setActive(category?.active ?? true);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
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

    if (category) {
      updateCategory.mutate(
        {
          id: category.id,
          data: {
            name: name.trim(),
            code: code.trim() || null,
            expenseAccountId,
            active,
          },
        },
        {
          onSuccess: () => {
            toast.success('Cost category updated', {
              description: name.trim(),
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

    createCategory.mutate(
      {
        name: name.trim(),
        code: code.trim() || undefined,
        expenseAccountId: expenseAccountId ?? undefined,
      },
      {
        onSuccess: () => {
          toast.success('Cost category created', {
            description: name.trim(),
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
          <DialogTitle>
            {isEdit ? 'Edit cost category' : 'New cost category'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the budget head name, code, linked expense account, or status.'
              : 'Add a budget head used to allocate and track project costs.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="cost-category-form"
          onSubmit={handleSubmit}
          className="space-y-4 py-1"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="cost-category-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cost-category-name"
                placeholder="e.g. Materials"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="cost-category-code">
                Code{' '}
                <span className="text-muted-foreground text-xs">
                  (optional)
                </span>
              </Label>
              <Input
                id="cost-category-code"
                placeholder="e.g. MAT"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Expense account{' '}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <div className="flex items-center gap-2">
              <AccountCombobox
                accounts={expenseAccounts}
                value={expenseAccountId ?? undefined}
                onSelect={(accountId) => setExpenseAccountId(accountId)}
                placeholder="Link an expense account"
              />
              {expenseAccountId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpenseAccountId(null)}
                  aria-label="Clear expense account"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              Costs tagged to this category post against the linked expense
              account.
            </p>
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="cost-category-status">Status</Label>
              <Select
                value={active ? 'active' : 'inactive'}
                onValueChange={(value) => setActive(value === 'active')}
              >
                <SelectTrigger id="cost-category-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
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
          <Button type="submit" form="cost-category-form" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
