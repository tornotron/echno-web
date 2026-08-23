import { financeConstructionInvoiceService } from '@tornotron/echno-core/finance-construction-invoice/services';
import type {
  ConstructionInvoice,
  CreateConstructionInvoiceRequest,
  UpdateConstructionInvoiceRequest,
} from '@tornotron/echno-core/finance/types';

// Base path of the BFF proxy that forwards to the backend with the session token.
const API_BASE = '/api/v1';

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
  /**
   * Fetches the server-rendered PDF for an invoice as a Blob.
   *
   * The JSON api client cannot carry a binary body, so this issues a raw fetch
   * against the same `/api/v1` BFF proxy the typed services use; the proxy
   * attaches the session token and forwards the backend's `application/pdf`
   * response unchanged.
   */
  async downloadPdf(id: string): Promise<Blob> {
    const response = await fetch(
      `${API_BASE}/finance/construction-invoices/web/${id}/pdf`,
      { method: 'GET', headers: { Accept: 'application/pdf' } }
    );
    if (!response.ok) {
      throw new Error(`Failed to download invoice PDF (status ${response.status})`);
    }
    return response.blob();
  },
};
