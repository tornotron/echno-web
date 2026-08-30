import { describe, expect, test } from 'bun:test';
import { InvoiceStatus } from '@tornotron/echno-core/finance/types';
import {
  CUSTOMER_INVOICE_PAGE_SIZE,
  listQuery,
  readInvoicePage,
} from './customer-invoices-service';

function row(over: Record<string, unknown> = {}) {
  return {
    id: 'b2c3d4e5-0000-4000-8000-000000000001',
    invoiceNumber: 'INV-2026-0042',
    status: 'ISSUED',
    subtotal: 50_000,
    taxTotal: 9000,
    total: 59_000,
    amountPaid: 0,
    balanceDue: 59_000,
    lines: [],
    ...over,
  };
}

describe('readInvoicePage', () => {
  test('reads the rows out of the Spring page envelope', () => {
    const page = readInvoicePage({
      content: [row(), row({ id: 'b2c3d4e5-0000-4000-8000-000000000002' })],
      totalElements: 2,
      totalPages: 1,
    });
    expect(page.rows.length).toBe(2);
    expect(page.rows[0].invoiceNumber).toBe('INV-2026-0042');
    expect(page.rows[0].status).toBe(InvoiceStatus.ISSUED);
  });

  test('carries the total across, which is what the pager needs', () => {
    // The rows on one page say nothing about how many pages follow. Without the
    // envelope's count a short page is the only end-of-list signal there is,
    // and a full last page then offers a Next that lands on nothing.
    const page = readInvoicePage({
      content: [row()],
      totalElements: 41,
      totalPages: 3,
    });
    expect(page.totalElements).toBe(41);
    expect(page.totalPages).toBe(3);
  });

  test('an empty page is read as one, not as a failure', () => {
    const page = readInvoicePage({
      content: [],
      totalElements: 0,
      totalPages: 0,
    });
    expect(page.rows).toEqual([]);
    expect(page.totalElements).toBe(0);
  });

  test('a shape that is neither a page nor an array reads as empty', () => {
    expect(readInvoicePage({ error: 'gateway' }).rows).toEqual([]);
    expect(readInvoicePage(null).rows).toEqual([]);
  });

  test('a row that cannot be read is an error rather than a silently short list', () => {
    // Dropping an unreadable invoice would leave a receivables list that looks
    // complete and is not, so the read fails loudly instead.
    expect(() => readInvoicePage({ content: [row({ id: null })] })).toThrow();
  });
});

describe('listQuery', () => {
  test('pages from the first page at the shared size by default', () => {
    expect(listQuery()).toEqual({
      pageNo: 0,
      pageSize: CUSTOMER_INVOICE_PAGE_SIZE,
    });
  });

  test('a filter the caller did not set is left off entirely', () => {
    // An omitted parameter leaves that dimension unfiltered on the server. A
    // parameter sent as the string "undefined" is a 400 on customerId and a
    // silently wrong filter elsewhere.
    const query = listQuery({ pageNo: 2 });
    expect('customerId' in query).toBe(false);
    expect('status' in query).toBe(false);
    expect('openOnly' in query).toBe(false);
    expect(query.pageNo).toBe(2);
  });

  test('the filters that are set are sent', () => {
    const query = listQuery({
      customerId: 'c3d4e5f6-0000-4000-8000-000000000002',
      status: InvoiceStatus.DRAFT,
    });
    expect(query.customerId).toBe('c3d4e5f6-0000-4000-8000-000000000002');
    expect(query.status).toBe('DRAFT');
  });

  test('openOnly is sent only when it is on', () => {
    // Its server-side default is false, so sending it off is the same as not
    // sending it and only widens what the cache key has to distinguish.
    expect('openOnly' in listQuery({ openOnly: false })).toBe(false);
    expect(listQuery({ openOnly: true }).openOnly).toBe(true);
  });
});
