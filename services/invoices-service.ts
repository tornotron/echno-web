import { financeConstructionInvoiceService } from '@tornotron/echno-core/finance-construction-invoice/services';
import type { ConstructionInvoice } from '@tornotron/echno-core/finance/types';

export const invoicesService = {
  async getAll(): Promise<ConstructionInvoice[]> {
    return financeConstructionInvoiceService.getAll();
  },
  async getById(id: string): Promise<ConstructionInvoice> {
    return financeConstructionInvoiceService.getById(id);
  },
};
