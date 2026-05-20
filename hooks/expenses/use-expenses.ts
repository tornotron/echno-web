import { useQuery } from '@tanstack/react-query';
import { expensesService } from '@/services/expenses-service';
import { expenseKeys } from './expense-keys';

export const useExpenses = () =>
  useQuery({
    queryKey: expenseKeys.lists(),
    queryFn: () => expensesService.getAll(),
  });

export const useExpenseById = (id: number) =>
  useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expensesService.getById(id),
    enabled: !!id,
  });
