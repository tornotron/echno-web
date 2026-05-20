import { mockInvoices } from '@/components/shared/mock-data';
import type { Invoice } from '@/types/finance/invoice';

export const invoicesService = {
  async getAll(): Promise<Invoice[]> {
    return mockInvoices as Invoice[];
  },
  async getById(id: number): Promise<Invoice | null> {
    return (mockInvoices as Invoice[]).find((i) => i.id === id) ?? null;
  },
};
