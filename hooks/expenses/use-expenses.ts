import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesService } from '@/services/expenses-service';
import type { Expense } from '@/types/finance/expense';
import { expenseKeys } from './expense-keys';

/** Fetches all expenses for the current organization. */
export const useExpenses = () =>
  useQuery({
    queryKey: expenseKeys.lists(),
    queryFn: () => expensesService.getAll(),
  });

/**
 * Fetches a single expense by id. Stays disabled until `id` is a finite positive
 * number, so it is safe to call before the route param resolves.
 */
export const useExpenseById = (id: number) =>
  useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expensesService.getById(id),
    enabled: Number.isFinite(id) && id > 0,
  });

/**
 * Creates an expense and invalidates the expense list on success so the new row
 * appears without a manual refetch.
 */
export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Expense>) => expensesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
  });
};

/**
 * Updates an expense by id, then invalidates both the list and that expense's
 * detail cache so both views reflect the change.
 */
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Expense> }) =>
      expensesService.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
    },
  });
};

/**
 * Deletes an expense by id and invalidates the expense list so the removed row
 * disappears without a manual refetch.
 */
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => expensesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
  });
};
