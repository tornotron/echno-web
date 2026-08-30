import { describe, expect, test } from 'bun:test';
import {
  ContractType,
  isContractType,
  listQuery,
  parsePayable,
  PAYABLE_PAGE_SIZE,
  readPayablePage,
} from './payables-service';

function row(over: Record<string, unknown> = {}) {
  return {
    id: 41,
    payableNumber: 'PAY-2026-0041',
    contractorName: 'Sundar Constructions',
    contractType: 'SUBCONTRACTOR',
    amountRecorded: 250_000,
    amountPaid: 100_000,
    amountDue: 150_000,
    vendorId: 7,
    vendorName: 'Sundar Constructions Pvt Ltd',
    projectId: 3,
    projectName: 'Marina Towers',
    createdBy: { id: 12, name: 'Priya R' },
    createdAt: '2026-08-14T09:30:00',
    ...over,
  };
}

describe('parsePayable', () => {
  test('reads a payable off the wire', () => {
    const payable = parsePayable(row());
    expect(payable.id).toBe(41);
    expect(payable.payableNumber).toBe('PAY-2026-0041');
    expect(payable.contractType).toBe(ContractType.SUBCONTRACTOR);
    expect(payable.amountDue).toBe(150_000);
    expect(payable.vendorName).toBe('Sundar Constructions Pvt Ltd');
  });

  test('createdBy keeps the name the backend sent', () => {
    // Payable.createdBy is an Employee and PayableDto nests an EmployeeDto, so
    // unlike the *By fields elsewhere this is not a user id needing a lookup.
    const payable = parsePayable(row());
    expect(payable.createdBy?.id).toBe(12);
    expect(payable.createdBy?.name).toBe('Priya R');
  });

  test('an amount sent as a string is read, not zeroed', () => {
    // BigDecimal serialises as a JSON number by default and as a string under
    // WRITE_BIGDECIMAL_AS_PLAIN. Reading only one of the two would turn every
    // amount into NaN or zero the day that setting changes.
    const payable = parsePayable(
      row({ amountRecorded: '250000.00', amountPaid: '100000.00' })
    );
    expect(payable.amountRecorded).toBe(250_000);
    expect(payable.amountPaid).toBe(100_000);
  });

  test('a missing amountDue is recomputed rather than left blank', () => {
    const payable = parsePayable(row({ amountDue: undefined }));
    expect(payable.amountDue).toBe(150_000);
  });

  test('the server amountDue wins over the derived one', () => {
    // It is the number the overpayment check on the next payment uses, so a
    // disagreement has to resolve the server's way or the ceiling shown is
    // not the ceiling enforced.
    const payable = parsePayable(row({ amountDue: 149_000 }));
    expect(payable.amountDue).toBe(149_000);
  });

  test('an unreadable amount is an error, not a zero balance', () => {
    // A payable whose amount reads as 0.00 says the debt is settled.
    expect(() => parsePayable(row({ amountRecorded: null }))).toThrow();
    expect(() => parsePayable(row({ amountRecorded: 'n/a' }))).toThrow();
  });

  test('a missing amountPaid is nothing paid', () => {
    const payable = parsePayable(row({ amountPaid: null, amountDue: 250_000 }));
    expect(payable.amountPaid).toBe(0);
  });

  test('a row with no id or no payable number is refused', () => {
    expect(() => parsePayable(row({ id: null }))).toThrow();
    expect(() => parsePayable(row({ payableNumber: '' }))).toThrow();
    expect(() => parsePayable(null)).toThrow();
  });

  test('an unrecognised contract type is dropped rather than shown', () => {
    expect(parsePayable(row({ contractType: 'RETAINER' })).contractType).toBe(
      undefined
    );
  });
});

describe('isContractType', () => {
  test('accepts the backend enum values', () => {
    expect(isContractType('MATERIAL_SUPPLY')).toBe(true);
    expect(isContractType('OTHER')).toBe(true);
  });

  test('rejects an inherited property name', () => {
    // A membership test written with `in` walks the prototype chain, so
    // "toString" would pass it and reach the enum converter as a 400.
    expect(isContractType('toString')).toBe(false);
    expect(isContractType('constructor')).toBe(false);
  });

  test('rejects anything else', () => {
    expect(isContractType('RETAINER')).toBe(false);
    expect(isContractType(7)).toBe(false);
    expect(isContractType(undefined)).toBe(false);
  });
});

describe('readPayablePage', () => {
  test('reads the rows out of the Spring page envelope', () => {
    const page = readPayablePage({
      content: [row(), row({ id: 42, payableNumber: 'PAY-2026-0042' })],
      totalElements: 2,
      totalPages: 1,
    });
    expect(page.rows.length).toBe(2);
    expect(page.rows[1].payableNumber).toBe('PAY-2026-0042');
  });

  test('carries the totals the pager needs', () => {
    const page = readPayablePage({
      content: [row()],
      totalElements: 41,
      totalPages: 3,
    });
    expect(page.totalElements).toBe(41);
    expect(page.totalPages).toBe(3);
  });

  test('a bare array is one page of everything it holds', () => {
    // The outstanding and by-vendor endpoints answer a plain List, not a page.
    const page = readPayablePage([row(), row({ id: 42 })]);
    expect(page.rows.length).toBe(2);
    expect(page.totalElements).toBe(2);
    expect(page.totalPages).toBe(1);
  });

  test('a shape that is neither a page nor an array reads as empty', () => {
    expect(readPayablePage({ error: 'gateway' }).rows).toEqual([]);
    expect(readPayablePage(null).rows).toEqual([]);
  });

  test('a row that cannot be read fails the read rather than shortening it', () => {
    // Dropping a debt from an ageing list quietly is how a vendor stops being
    // paid, so this is loud.
    let status: number | undefined;
    try {
      readPayablePage({ content: [row(), row({ amountRecorded: null })] });
    } catch (error) {
      status = (error as { status?: number }).status;
    }
    expect(status).toBe(422);
  });
});

describe('listQuery', () => {
  test('pages from the first page at the shared size by default', () => {
    expect(listQuery()).toEqual({ pageNo: 0, pageSize: PAYABLE_PAGE_SIZE });
  });

  test('sends the page the caller asked for', () => {
    expect(listQuery({ pageNo: 2, pageSize: 50 })).toEqual({
      pageNo: 2,
      pageSize: 50,
    });
  });
});
