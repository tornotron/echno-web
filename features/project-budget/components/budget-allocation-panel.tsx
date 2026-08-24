'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import { Loader2, Trash2, Wallet } from 'lucide-react';
import {
  useProjectBudget,
  useCostCategories,
  useUpsertBudgetAllocation,
  useDeleteBudgetAllocation,
} from '@tornotron/echno-core/finance/hooks';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { toast } from '@/lib/styles/toast-styles';
import { formatBudgetAmount } from '../utils/format';

interface BudgetAllocationPanelProps {
  projectId: number;
}

/**
 * Sets an allocated amount per cost category for the project. Upsert is keyed
 * by category, so selecting a category already in the table updates its amount.
 */
export function BudgetAllocationPanel({
  projectId,
}: BudgetAllocationPanelProps) {
  const {
    data: allocations = [],
    isLoading,
    isError,
  } = useProjectBudget(projectId);
  const { data: categories = [] } = useCostCategories(true);
  const upsertAllocation = useUpsertBudgetAllocation();
  const deleteAllocation = useDeleteBudgetAllocation();

  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Categories offered in the picker: active categories plus any category that
  // already has an allocation (so an inactive-but-allocated one stays editable).
  const pickerCategories = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c.name]));
    for (const allocation of allocations) {
      if (!byId.has(allocation.costCategoryId)) {
        byId.set(allocation.costCategoryId, allocation.costCategoryName);
      }
    }
    return [...byId.entries()].map(([id, name]) => ({ id, name }));
  }, [categories, allocations]);

  function handleSave() {
    const parsed = Number.parseFloat(amount);
    if (!categoryId) {
      toast.error('Select a cost category');
      return;
    }
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error('Enter a valid allocated amount');
      return;
    }

    upsertAllocation.mutate(
      {
        projectId,
        costCategoryId: categoryId,
        data: { allocatedAmount: parsed },
      },
      {
        onSuccess: (allocation) => {
          toast.success('Budget allocation saved', {
            description: `${allocation.costCategoryName} · ${formatBudgetAmount(
              allocation.allocatedAmount
            )}`,
          });
          setCategoryId('');
          setAmount('');
        },
        onError: (error) =>
          toast.error(getErrorTitle(error, 'Save failed'), {
            description: getErrorMessage(error),
          }),
      }
    );
  }

  function handleEdit(costCategoryId: string, allocatedAmount: number) {
    setCategoryId(costCategoryId);
    setAmount(String(allocatedAmount));
  }

  function handleRemove(costCategoryId: string, costCategoryName: string) {
    setRemovingId(costCategoryId);
    deleteAllocation.mutate(
      { projectId, costCategoryId },
      {
        onSuccess: () => {
          toast.success('Allocation removed', {
            description: costCategoryName,
          });
          setRemovingId(null);
        },
        onError: (error) => {
          setRemovingId(null);
          toast.error(getErrorTitle(error, 'Remove failed'), {
            description: getErrorMessage(error),
          });
        },
      }
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-5 w-5" />
          Budget allocation
        </CardTitle>
        <CardDescription>
          Allocate the project budget across cost categories.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add / update form */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="allocation-category">Cost category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="allocation-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {pickerCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:w-48">
            <Label htmlFor="allocation-amount">Allocated amount (₹)</Label>
            <Input
              id="allocation-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={upsertAllocation.isPending}
            className="sm:mb-0"
          >
            {upsertAllocation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save allocation
          </Button>
        </div>

        {pickerCategories.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No active cost categories yet. Create cost categories under Finance
            to allocate a budget.
          </p>
        )}

        {/* Existing allocations */}
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}

        {isError && (
          <p className="text-destructive text-sm">
            Failed to load budget allocations. Please try again.
          </p>
        )}

        {!isLoading && !isError && allocations.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No budget allocated yet.
          </p>
        )}

        {!isLoading && !isError && allocations.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Cost category</TableHead>
                  <TableHead className="min-w-[140px] text-right">
                    Allocated
                  </TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell className="font-medium">
                      {allocation.costCategoryName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBudgetAmount(allocation.allocatedAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleEdit(
                              allocation.costCategoryId,
                              allocation.allocatedAmount
                            )
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          disabled={removingId === allocation.costCategoryId}
                          onClick={() =>
                            handleRemove(
                              allocation.costCategoryId,
                              allocation.costCategoryName
                            )
                          }
                          aria-label="Remove allocation"
                        >
                          {removingId === allocation.costCategoryId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
