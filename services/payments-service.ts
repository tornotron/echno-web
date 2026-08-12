import { financeConstructionPaymentService } from '@tornotron/echno-core/finance-construction-payment/services';
import type {
  ConstructionPayment,
  CreateConstructionPaymentRequest,
  UpdateConstructionPaymentRequest,
} from '@tornotron/echno-core/finance/types';

export const paymentsService = {
  async getAll(): Promise<ConstructionPayment[]> {
    return financeConstructionPaymentService.getAll();
  },
  async getById(id: string): Promise<ConstructionPayment> {
    return financeConstructionPaymentService.getById(id);
  },
  async create(
    req: CreateConstructionPaymentRequest
  ): Promise<ConstructionPayment> {
    return financeConstructionPaymentService.create(req);
  },
  async update(
    id: string,
    req: UpdateConstructionPaymentRequest
  ): Promise<ConstructionPayment> {
    return financeConstructionPaymentService.update(id, req);
  },
};
