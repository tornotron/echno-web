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
  /**
   * Records the signed-in user as the voucher's verifier. Nothing about the
   * verifier is sent: the backend takes it from the session.
   */
  async verify(id: string): Promise<ConstructionPayment> {
    return financeConstructionPaymentService.verify(id);
  },
  /**
   * Voids the voucher, recording why. The reason is required and non-blank,
   * and this is the only route to a cancelled voucher.
   */
  async cancel(id: string, reason: string): Promise<ConstructionPayment> {
    return financeConstructionPaymentService.cancel(id, reason);
  },
};
