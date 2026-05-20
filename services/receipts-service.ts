import { mockReceipts } from '@/components/shared/mock-data';
import type { Receipt } from '@/types/finance/receipt';

export const receiptsService = {
  async getAll(): Promise<Receipt[]> {
    return mockReceipts as Receipt[];
  },
  async getById(id: number): Promise<Receipt | null> {
    return (mockReceipts as Receipt[]).find((r) => r.id === id) ?? null;
  },
};
