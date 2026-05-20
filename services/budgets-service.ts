import { mockBudgets } from '@/components/shared/mock-data';
import type { Budget } from '@/types/finance/budget';

export const budgetsService = {
  async getAll(): Promise<Budget[]> {
    return mockBudgets as Budget[];
  },
  async getById(id: number): Promise<Budget | null> {
    return (mockBudgets as Budget[]).find((b) => b.id === id) ?? null;
  },
};
