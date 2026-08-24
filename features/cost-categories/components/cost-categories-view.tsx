'use client';

import { useState } from 'react';
import { Card } from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Badge } from '@/components/shadcn/badge';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { Plus, Sparkles, Loader2, Tags, Pencil, Ban } from 'lucide-react';
import {
  useCostCategories,
  useDeactivateCostCategory,
  useSeedDefaultCostCategories,
} from '@tornotron/echno-core/finance/hooks';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import type { CostCategory } from '@tornotron/echno-core/finance/types';
import { useAuthorization } from '@/hooks/use-authorization';
import { toast } from '@/lib/styles/toast-styles';
import { CostCategoryFormDialog } from './cost-category-form-dialog';
import { DeactivateCostCategoryDialog } from './deactivate-cost-category-dialog';

export function CostCategoriesView() {
  const { isSystemAdmin } = useAuthorization();
  // Show inactive categories too so they can be reactivated by editing.
  const {
    data: categories = [],
    isLoading,
    isError,
  } = useCostCategories(false);

  const deactivateCategory = useDeactivateCostCategory();
  const seedDefaults = useSeedDefaultCostCategories();

  // Create / edit dialog state.
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CostCategory | null>(null);

  // Deactivate dialog state.
  const [deactivateTarget, setDeactivateTarget] = useState<CostCategory | null>(
    null
  );

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(category: CostCategory) {
    setEditTarget(category);
    setFormOpen(true);
  }

  function confirmDeactivate() {
    if (!deactivateTarget) return;
    const target = deactivateTarget;
    deactivateCategory.mutate(target.id, {
      onSuccess: () => {
        toast.success('Cost category deactivated', {
          description: target.name,
        });
        setDeactivateTarget(null);
      },
      onError: (error) =>
        toast.error(getErrorTitle(error, 'Deactivation failed'), {
          description: getErrorMessage(error),
        }),
    });
  }

  function handleSeedDefaults() {
    seedDefaults.mutate(undefined, {
      onSuccess: (result) => {
        toast.success(
          result.created > 0
            ? `Seeded ${result.created} default categories`
            : 'Categories already seeded',
          {
            description:
              result.created > 0
                ? 'The default cost categories are ready.'
                : 'This organization already has cost categories.',
          }
        );
      },
      onError: (error) =>
        toast.error(getErrorTitle(error, 'Seeding failed'), {
          description: getErrorMessage(error),
        }),
    });
  }

  const isEmpty = !isLoading && !isError && categories.length === 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New category
        </Button>
        {isSystemAdmin && (
          <Button
            variant="outline"
            onClick={handleSeedDefaults}
            disabled={seedDefaults.isPending}
          >
            {seedDefaults.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Seed defaults
          </Button>
        )}
      </div>

      {isLoading && (
        <Card className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </Card>
      )}

      {isError && (
        <Card className="p-6">
          <p className="text-destructive text-sm">
            Failed to load cost categories. Please try again.
          </p>
        </Card>
      )}

      {isEmpty && (
        <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
          <Tags className="text-muted-foreground h-10 w-10" />
          <div>
            <p className="font-medium">No cost categories yet</p>
            <p className="text-muted-foreground text-sm">
              {isSystemAdmin
                ? 'Seed the default cost categories to get started, or add them manually.'
                : 'Add your first budget head to get started.'}
            </p>
          </div>
          <div className="flex gap-2">
            {isSystemAdmin && (
              <Button
                variant="outline"
                onClick={handleSeedDefaults}
                disabled={seedDefaults.isPending}
              >
                {seedDefaults.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Seed defaults
              </Button>
            )}
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New category
            </Button>
          </div>
        </Card>
      )}

      {!isLoading && !isError && categories.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Code</TableHead>
                  <TableHead className="min-w-[200px]">Name</TableHead>
                  <TableHead className="min-w-[200px]">
                    Expense account
                  </TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-mono text-xs">
                      {category.code || '—'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {category.expenseAccountCode ? (
                        <span className="font-mono text-xs">
                          {category.expenseAccountCode}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={category.active ? 'outline' : 'secondary'}
                      >
                        {category.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(category)}
                          aria-label="Edit cost category"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {category.active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeactivateTarget(category)}
                            aria-label="Deactivate cost category"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <CostCategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editTarget}
      />

      <DeactivateCostCategoryDialog
        open={deactivateTarget !== null}
        onOpenChange={(next) => {
          if (!next) setDeactivateTarget(null);
        }}
        categoryLabel={deactivateTarget?.name ?? ''}
        isPending={deactivateCategory.isPending}
        onConfirm={confirmDeactivate}
      />
    </div>
  );
}
