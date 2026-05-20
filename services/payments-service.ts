import { mockPayments } from '@/components/shared/mock-data';
import type { Payment } from '@/types/finance/payment';

export const paymentsService = {
  async getAll(): Promise<Payment[]> {
    return mockPayments as Payment[];
  },
  async getById(id: number): Promise<Payment | null> {
    return (mockPayments as Payment[]).find((p) => p.id === id) ?? null;
  },
};
