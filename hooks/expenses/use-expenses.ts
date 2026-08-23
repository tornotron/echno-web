import { useQuery } from '@tanstack/react-query';
import { expensesService } from '@/services/expenses-service';
import { expenseKeys } from './expense-keys';

/** Fetches all expenses for the current organization. */
export const useExpenses = () =>
  useQuery({
    queryKey: expenseKeys.lists(),
    queryFn: () => expensesService.getAll(),
  });

/**
 * Fetches a single expense by id. Stays disabled until `id` is truthy, so it is
 * safe to call before the route param resolves.
 */
export const useExpenseById = (id: number) =>
  useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expensesService.getById(id),
    enabled: !!id,
  });
