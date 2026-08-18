import { describe, expect, test } from 'bun:test';
import {
  ContractPaymentStatus,
  ContractStatus,
  ContractType,
} from '@/types/third-party/sub-contract';
import type { SubContractFormValues } from '@/features/sub-contracts/components/sub-contract-form';
import {
  derivePaymentStatus,
  parseSubContract,
  toPayload,
} from './sub-contracts-service';

describe('derivePaymentStatus (MONEY)', () => {
  test('nothing paid is notStarted', () => {
    expect(derivePaymentStatus(1000, 0)).toBe(ContractPaymentStatus.notStarted);
    expect(derivePaymentStatus(1000, -5)).toBe(
      ContractPaymentStatus.notStarted
    );
  });

  test('paid at or above the value is fullyPaid', () => {
    expect(derivePaymentStatus(1000, 1000)).toBe(
      ContractPaymentStatus.fullyPaid
    );
    expect(derivePaymentStatus(1000, 1500)).toBe(
      ContractPaymentStatus.fullyPaid
    );
  });

  test('a partial payment is inProgress', () => {
    expect(derivePaymentStatus(1000, 400)).toBe(
      ContractPaymentStatus.inProgress
    );
  });
});

describe('parseSubContract', () => {
  test('throws when the id is missing', () => {
    expect(() => parseSubContract({})).toThrow('missing id');
  });

  test('totalDue falls back to contractValue - totalPaid when null', () => {
    const sc = parseSubContract({
      id: 1,
      contractValue: 1000,
      totalPaid: 300,
    });
    expect(sc.totalDue).toBe(700);
  });

  test('an explicit totalDue is used as-is', () => {
    const sc = parseSubContract({
      id: 1,
      contractValue: 1000,
      totalPaid: 300,
      totalDue: 650,
    });
    expect(sc.totalDue).toBe(650);
  });

  test('an unknown enum value falls back to the default', () => {
    const sc = parseSubContract({ id: 1, type: 'nonsense', status: 'nope' });
    expect(sc.type).toBe(ContractType.lumpsum);
    expect(sc.status).toBe(ContractStatus.active);
  });

  test('a valid enum value is preserved', () => {
    const sc = parseSubContract({
      id: 1,
      type: ContractType.costPlus,
      status: ContractStatus.completed,
    });
    expect(sc.type).toBe(ContractType.costPlus);
    expect(sc.status).toBe(ContractStatus.completed);
  });

  test('duration is the whole-day gap between start and end', () => {
    const sc = parseSubContract({
      id: 1,
      startDate: '2026-01-01',
      endDate: '2026-01-11',
    });
    expect(sc.duration).toBe(10);
  });

  test('contractName defaults to empty and contractId falls back to the id', () => {
    const sc = parseSubContract({ id: 42 });
    expect(sc.contractName).toBe('');
    expect(sc.contractId).toBe('42');
  });

  test('derives the payment status from the amounts', () => {
    const sc = parseSubContract({
      id: 1,
      contractValue: 1000,
      totalPaid: 1000,
    });
    expect(sc.paymentStatus).toBe(ContractPaymentStatus.fullyPaid);
  });
});

function formValues(over: Record<string, unknown>): SubContractFormValues {
  return {
    contractId: '',
    contractName: '',
    contractorName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    panNumber: '',
    workType: '',
    status: '',
    scope: '',
    contractValue: 0,
    totalPaid: 0,
    totalDue: 0,
    completionPercentage: 0,
    paymentTerms: '',
    startDate: '',
    endDate: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    notes: '',
    milestones: [],
    ...over,
  } as unknown as SubContractFormValues;
}

describe('toPayload', () => {
  test('expands the flat contractor fields onto prefixed backend names', () => {
    const payload = toPayload(
      formValues({
        contractId: 'SC-1',
        contractorName: 'ACME',
        contactPerson: 'Sam',
        phone: '999',
        email: 'a@b.com',
        address: 'MG Road',
        gstNumber: 'GST1',
        accountNumber: 'AC1',
        ifscCode: 'IF1',
      })
    );
    expect(payload.contractorContactPerson).toBe('Sam');
    expect(payload.contractorPhone).toBe('999');
    expect(payload.contractorEmail).toBe('a@b.com');
    expect(payload.contractorAddress).toBe('MG Road');
    expect(payload.contractorGst).toBe('GST1');
    expect(payload.bankAccountNumber).toBe('AC1');
    expect(payload.bankIfsc).toBe('IF1');
  });

  test('contractName falls back to contractorName when contractId is blank', () => {
    const payload = toPayload(
      formValues({ contractId: '', contractorName: 'ACME' })
    );
    expect(payload.contractName).toBe('ACME');
  });

  test('contractName uses the contractId when present', () => {
    const payload = toPayload(
      formValues({ contractId: 'SC-9', contractorName: 'ACME' })
    );
    expect(payload.contractName).toBe('SC-9');
  });

  test('blank optional strings become undefined', () => {
    const payload = toPayload(formValues({ notes: '   ', paymentTerms: '' }));
    expect(payload.notes).toBeUndefined();
    expect(payload.paymentTerms).toBeUndefined();
  });

  test('maps milestones onto the backend shape', () => {
    const payload = toPayload(
      formValues({
        milestones: [
          {
            name: 'M1',
            percentage: 25,
            amount: 250,
            status: 'pending',
            date: '2026-02-01',
          },
        ],
      })
    );
    expect(payload.milestones).toEqual([
      {
        name: 'M1',
        paymentPercentage: 25,
        amount: 250,
        status: 'pending',
        targetDate: '2026-02-01',
      },
    ]);
  });
});
