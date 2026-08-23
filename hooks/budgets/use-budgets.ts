import { useQuery } from '@tanstack/react-query';
import { budgetsService } from '@/services/budgets-service';
import { budgetKeys } from './budget-keys';

/** Fetches all project budgets for the current organization. */
export const useBudgets = () =>
  useQuery({
    queryKey: budgetKeys.lists(),
    queryFn: () => budgetsService.getAll(),
  });

/**
 * Fetches a single budget by id. Stays disabled until `id` is truthy, so it is
 * safe to call before the route param resolves.
 */
export const useBudgetById = (id: number) =>
  useQuery({
    queryKey: budgetKeys.detail(id),
    queryFn: () => budgetsService.getById(id),
    enabled: !!id,
  });
