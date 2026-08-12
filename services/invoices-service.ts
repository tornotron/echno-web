import { financeConstructionInvoiceService } from '@tornotron/echno-core/finance-construction-invoice/services';
import type {
  ConstructionInvoice,
  CreateConstructionInvoiceRequest,
  UpdateConstructionInvoiceRequest,
} from '@tornotron/echno-core/finance/types';

export const invoicesService = {
  async getAll(): Promise<ConstructionInvoice[]> {
    return financeConstructionInvoiceService.getAll();
  },
  async getById(id: string): Promise<ConstructionInvoice> {
    return financeConstructionInvoiceService.getById(id);
  },
  async create(
    req: CreateConstructionInvoiceRequest
  ): Promise<ConstructionInvoice> {
    return financeConstructionInvoiceService.create(req);
  },
  async update(
    id: string,
    req: UpdateConstructionInvoiceRequest
  ): Promise<ConstructionInvoice> {
    return financeConstructionInvoiceService.update(id, req);
  },
};
