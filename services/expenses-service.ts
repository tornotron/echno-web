import { mockExpenses } from '@/components/shared/mock-data';
import type { Expense } from '@/types/finance/expense';

export const expensesService = {
  async getAll(): Promise<Expense[]> {
    return mockExpenses as Expense[];
  },
  async getById(id: number): Promise<Expense | null> {
    return (mockExpenses as Expense[]).find((e) => e.id === id) ?? null;
  },
};
