import { describe, expect, test } from 'bun:test';
import { ConstructionPayeeType } from '@/types/finance/payment';
import type { ConstructionPayment } from '@/types/finance/payment';
import {
  getPayeeInfo,
  formatPayeeName,
  matchesAmountSearch,
  getPayeesByType,
  type PayeeDatasets,
} from './payment-utils';

const emptyDatasets: PayeeDatasets = {
  vendors: [],
  employees: [],
  subContracts: [],
  labour: [],
};

// Minimal fixtures cast to the datasets shape; getPayeeInfo only reads the fields set here.
function datasets(over: Partial<PayeeDatasets>): PayeeDatasets {
  return { ...emptyDatasets, ...over };
}

function payment(over: Record<string, unknown>): ConstructionPayment {
  return over as unknown as ConstructionPayment;
}

const labour = [{ id: 5, fullName: 'Ravi Kumar', specialization: 'Mason', labourId: 'L-01' }];
const subContracts = [{ id: 7, contractorName: 'ACME', contractorCompany: 'ACME Pvt', contractId: 'SC-01' }];
const vendors = [{ id: 3, name: 'BuildMart', contactPerson: 'Sam', address: 'MG Road' }];
const employees = [{ id: 9, name: 'Anjali', employeeId: 'E-09' }];

describe('getPayeeInfo', () => {
  test('resolves a labour payee by id', () => {
    const info = getPayeeInfo(
      payment({ labourId: 5 }),
      datasets({ labour: labour as unknown as PayeeDatasets['labour'] })
    );
    expect(info.type).toBe(ConstructionPayeeType.LABOUR);
    expect(info.name).toBe('Ravi Kumar');
    expect(info.details).toBe('Mason - L-01');
  });

  test('labour wins over a vendor when both ids are set (priority order)', () => {
    const info = getPayeeInfo(
      payment({ labourId: 5, vendorId: 3 }),
      datasets({
        labour: labour as unknown as PayeeDatasets['labour'],
        vendors: vendors as unknown as PayeeDatasets['vendors'],
      })
    );
    expect(info.type).toBe(ConstructionPayeeType.LABOUR);
  });

  test('falls through to the next payee when the id is not in the dataset', () => {
    // labourId set but no labour in the dataset -> resolves the vendor instead.
    const info = getPayeeInfo(
      payment({ labourId: 999, vendorId: 3 }),
      datasets({ vendors: vendors as unknown as PayeeDatasets['vendors'] })
    );
    expect(info.type).toBe(ConstructionPayeeType.VENDOR);
    expect(info.name).toBe('Sam'); // contactPerson preferred over company name
    expect(info.company).toBe('BuildMart');
  });

  test('resolves a sub-contractor', () => {
    const info = getPayeeInfo(
      payment({ subContractId: 7 }),
      datasets({ subContracts: subContracts as unknown as PayeeDatasets['subContracts'] })
    );
    expect(info.type).toBe(ConstructionPayeeType.SUB_CONTRACTOR);
    expect(info.name).toBe('ACME');
    expect(info.company).toBe('ACME Pvt');
  });

  test('resolves an employee', () => {
    const info = getPayeeInfo(
      payment({ employeeId: 9 }),
      datasets({ employees: employees as unknown as PayeeDatasets['employees'] })
    );
    expect(info.type).toBe(ConstructionPayeeType.EMPLOYEE);
    expect(info.name).toBe('Anjali');
    expect(info.details).toBe('E-09');
  });

  test('uses the manual payee fields when no linked entity matches', () => {
    const info = getPayeeInfo(
      payment({ payeeType: ConstructionPayeeType.CONSULTANT, payeeName: 'Priya', payeeDetails: 'Structural' }),
      emptyDatasets
    );
    expect(info.type).toBe(ConstructionPayeeType.CONSULTANT);
    expect(info.name).toBe('Priya');
    expect(info.details).toBe('Structural');
  });

  test('falls back to an Unknown Payee', () => {
    const info = getPayeeInfo(payment({}), emptyDatasets);
    expect(info.type).toBe(ConstructionPayeeType.OTHER);
    expect(info.name).toBe('Unknown Payee');
  });
});

describe('formatPayeeName', () => {
  test('appends the company in parentheses when present', () => {
    expect(formatPayeeName({ type: ConstructionPayeeType.VENDOR, name: 'Sam', company: 'BuildMart' }))
      .toBe('Sam (BuildMart)');
  });

  test('returns just the name without a company', () => {
    expect(formatPayeeName({ type: ConstructionPayeeType.EMPLOYEE, name: 'Anjali' })).toBe('Anjali');
  });
});

describe('matchesAmountSearch', () => {
  test('matches an exact amount', () => {
    expect(matchesAmountSearch(8500, '8500')).toBe(true);
  });

  test('matches a substring of a larger amount', () => {
    expect(matchesAmountSearch(18_500, '8500')).toBe(true);
    expect(matchesAmountSearch(85_000, '8500')).toBe(true);
  });

  test('strips commas and decimal points from the query', () => {
    expect(matchesAmountSearch(18_500, '8,5.00')).toBe(true);
  });

  test('trims whitespace', () => {
    expect(matchesAmountSearch(8500, '  850 ')).toBe(true);
  });

  test('does not match an unrelated amount', () => {
    expect(matchesAmountSearch(8500, '9000')).toBe(false);
  });
});

describe('getPayeesByType', () => {
  test('maps employees, dropping any without an id, into id/name/label', () => {
    const rows = getPayeesByType(
      ConstructionPayeeType.EMPLOYEE,
      datasets({
        employees: [
          { id: 9, name: 'Anjali', employeeId: 'E-09' },
          { id: undefined, name: 'NoId', employeeId: 'E-00' },
        ] as unknown as PayeeDatasets['employees'],
      })
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({ id: 9, name: 'Anjali', label: 'Anjali (E-09)' });
  });

  test('maps vendors with a contactPerson-aware label', () => {
    const rows = getPayeesByType(
      ConstructionPayeeType.VENDOR,
      datasets({ vendors: vendors as unknown as PayeeDatasets['vendors'] })
    );
    expect(rows[0]).toEqual({ id: 3, name: 'BuildMart', label: 'BuildMart - Sam' });
  });

  test('returns an empty list for a type with no dataset mapping', () => {
    expect(getPayeesByType(ConstructionPayeeType.BANK, emptyDatasets)).toEqual([]);
  });
});
