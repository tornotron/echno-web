import { api, ApiError, logger } from '@tornotron/echno-core';
import { parseInvoice } from '@tornotron/echno-core/finance/types';
import type {
  Invoice,
  InvoiceStatus,
} from '@tornotron/echno-core/finance/types';

/**
 * The accounts-receivable invoice listing.
 *
 * `echno-core` carries the rest of the AR invoice client (get by id, create
 * draft, issue, cancel) but not the listing: the endpoint did not exist when
 * that module was written and its doc comment still says so. The listing landed
 * in backend #582, and this is the client for it until it moves into core.
 *
 * `GET /api/v1/finance/invoices/web` → `Page<InvoiceDto>`, newest invoice date
 * first with the invoice number breaking a same-day tie. The order is fixed
 * server side, so paging is stable between requests and there is no sort to
 * choose here.
 */
const BASE = '/finance/invoices/web';

/** Rows per page. Matches the other finance listings. */
export const CUSTOMER_INVOICE_PAGE_SIZE = 20;

/** Filters the listing accepts. They combine with AND, as they do on the server. */
export interface CustomerInvoiceListParams {
  /** Zero-based page index. */
  pageNo?: number;
  /** Rows per page. The shared `PageQuery` caps this at 500. */
  pageSize?: number;
  /** Restrict to invoices billed to one customer. */
  customerId?: string;
  /** Restrict to one lifecycle status. */
  status?: InvoiceStatus;
  /**
   * Restrict to what is still owed, that is `ISSUED` or `PARTIALLY_PAID`. This
   * is the one thing `status` cannot express, because an unpaid balance spans
   * two statuses.
   */
  openOnly?: boolean;
}

/** One page of invoices, with the count the pager needs to know where it is. */
export interface CustomerInvoicePage {
  rows: Invoice[];
  /** Total matching invoices across every page, from the Spring envelope. */
  totalElements: number;
  /** Total pages at the requested size. */
  totalPages: number;
}

const EMPTY_PAGE: CustomerInvoicePage = {
  rows: [],
  totalElements: 0,
  totalPages: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * Reads a Spring `Page<InvoiceDto>` into typed rows and its counts.
 *
 * A shape that is neither a page nor a bare array is logged and read as an
 * empty page, which is how the sibling construction-invoice client in core
 * treats the same situation: a partial outage leaves the screen empty rather
 * than broken. A row that is present but unreadable is a different matter and
 * becomes a 422, because silently dropping an invoice from a receivables list
 * is worse than saying the list could not be read.
 *
 * @param raw - The parsed JSON body from the listing endpoint.
 * @returns The page's rows and totals.
 */
export function readInvoicePage(raw: unknown): CustomerInvoicePage {
  const items = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.content)
      ? raw.content
      : null;

  if (items === null) {
    logger.warn('The invoice listing returned an unexpected format:', {
      type: typeof raw,
      keys: isRecord(raw) ? Object.keys(raw) : null,
    });
    return EMPTY_PAGE;
  }

  let rows: Invoice[];
  try {
    rows = items.map((item) => parseInvoice(item));
  } catch (error) {
    logger.error('Failed to read the invoice listing:', error);
    throw new ApiError(
      'The invoices could not be read. Reload the page to try again.',
      422
    );
  }

  // A bare array carries no envelope, so the rows in hand are all there is.
  if (Array.isArray(raw)) {
    return { rows, totalElements: rows.length, totalPages: 1 };
  }

  const envelope = raw as Record<string, unknown>;
  return {
    rows,
    totalElements: asCount(envelope.totalElements),
    totalPages: asCount(envelope.totalPages),
  };
}

/**
 * Builds the query string for the listing, leaving out every filter the caller
 * did not set.
 *
 * An omitted parameter leaves that dimension unfiltered on the server, so an
 * `undefined` must not be sent as the string "undefined". `openOnly` is only
 * sent when it is true for the same reason: its server-side default is false.
 *
 * @param params - The filters and page the caller asked for.
 * @returns The query parameters to send.
 */
export function listQuery(
  params: CustomerInvoiceListParams = {}
): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {
    pageNo: params.pageNo ?? 0,
    pageSize: params.pageSize ?? CUSTOMER_INVOICE_PAGE_SIZE,
  };
  if (params.customerId) query.customerId = params.customerId;
  if (params.status) query.status = params.status;
  if (params.openOnly) query.openOnly = true;
  return query;
}

export const customerInvoicesService = {
  /**
   * Lists accounts-receivable invoices in the current organization.
   *
   * @param params - Optional page and `customerId` / `status` / `openOnly` filters.
   * @returns The requested page of invoices.
   * @throws {ApiError} On a non-2xx response, or 422 if a row cannot be read.
   */
  async list(
    params: CustomerInvoiceListParams = {}
  ): Promise<CustomerInvoicePage> {
    return readInvoicePage(await api.get<unknown>(BASE, listQuery(params)));
  },
};
