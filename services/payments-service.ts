import { financeConstructionPaymentService } from '@tornotron/echno-core/finance-construction-payment/services';
import type { ConstructionPayment } from '@tornotron/echno-core/finance/types';

export const paymentsService = {
  async getAll(): Promise<ConstructionPayment[]> {
    return financeConstructionPaymentService.getAll();
  },
  async getById(id: string): Promise<ConstructionPayment> {
    return financeConstructionPaymentService.getById(id);
  },
};
