import { useQuery } from '@tanstack/react-query';
import { budgetsService } from '@/services/budgets-service';
import { budgetKeys } from './budget-keys';

export const useBudgets = () =>
  useQuery({
    queryKey: budgetKeys.lists(),
    queryFn: () => budgetsService.getAll(),
  });

export const useBudgetById = (id: number) =>
  useQuery({
    queryKey: budgetKeys.detail(id),
    queryFn: () => budgetsService.getById(id),
    enabled: !!id,
  });
