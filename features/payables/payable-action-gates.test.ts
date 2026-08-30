import { describe, expect, test } from 'bun:test';
import { ContractType } from '@/services/payables-service';
import type { Payable } from '@/services/payables-service';
import {
  AMOUNT_MAX,
  checkAmount,
  checkPayableDraft,
  checkPaymentAmount,
  CONTRACTOR_NAME_MAX_LENGTH,
  payablePaymentGate,
  PAYABLE_NUMBER_MAX_LENGTH,
} from './payable-action-gates';

function payable(over: Partial<Payable> = {}): Payable {
  return {
    id: 41,
    payableNumber: 'PAY-2026-0041',
    contractorName: 'Sundar Constructions',
    contractType: ContractType.SUBCONTRACTOR,
    amountRecorded: 250_000,
    amountPaid: 100_000,
    amountDue: 150_000,
    ...over,
  };
}

function draft(over: Record<string, string> = {}) {
  return {
    payableNumber: 'PAY-2026-0042',
    contractorName: 'Sundar Constructions',
    contractType: ContractType.SUBCONTRACTOR as string,
    amountRecorded: '250000.00',
    projectId: '3',
    vendorId: '',
    goodsReceivedNoteId: '',
    ...over,
  };
}

const asEmployee = { hasEmployeeRecord: true };

describe('checkAmount', () => {
  test('accepts a plain amount', () => {
    const check = checkAmount('12500.50');
    expect(check.valid).toBe(true);
    expect(check.valid && check.amount).toBe(12_500.5);
  });

  test('refuses a third decimal place rather than letting it round', () => {
    // The columns are scale 2. A third place is not a validation error: it
    // reaches the driver and is rounded there, so the amount stored is not the
    // amount typed and nothing says so.
    const check = checkAmount('99.999');
    expect(check.valid).toBe(false);
    expect(check.valid === false && check.reason).toContain('2 decimal places');
  });

  test('refuses an amount past what the column holds', () => {
    // precision 15 scale 2. Past it is a numeric overflow at the database
    // rather than a 400, so the user would see a 500 with nothing to act on.
    expect(checkAmount(String(AMOUNT_MAX + 1)).valid).toBe(false);
    expect(checkAmount('9999999999999.99').valid).toBe(true);
  });

  test('refuses zero and blanks unless zero was asked for', () => {
    expect(checkAmount('0').valid).toBe(false);
    expect(checkAmount('   ').valid).toBe(false);
    expect(checkAmount('0', { allowZero: true }).valid).toBe(true);
  });

  test('refuses anything Number() would quietly reinterpret', () => {
    // "1e5" is a hundred thousand to Number and a typo to a person; "1,000" is
    // NaN; "-5" would send a negative through @Positive.
    expect(checkAmount('1e5').valid).toBe(false);
    expect(checkAmount('1,000').valid).toBe(false);
    expect(checkAmount('-5').valid).toBe(false);
    expect(checkAmount('12.').valid).toBe(false);
    expect(checkAmount('abc').valid).toBe(false);
  });
});

describe('checkPaymentAmount', () => {
  test('accepts a payment up to what is still owed', () => {
    expect(checkPaymentAmount('150000', payable()).valid).toBe(true);
    expect(checkPaymentAmount('1', payable()).valid).toBe(true);
  });

  test('refuses a payment that would overpay', () => {
    // PayableService.recordPayment refuses any payment whose new paid total
    // passes amountRecorded, and the ceiling that leaves is amountDue.
    const check = checkPaymentAmount('150000.01', payable());
    expect(check.valid).toBe(false);
    expect(check.valid === false && check.reason).toContain('150000.00');
  });

  test('the ceiling follows the row rather than the recorded total', () => {
    // A payable already half paid takes half, not all of it again.
    expect(
      checkPaymentAmount('250000', payable({ amountPaid: 100_000 })).valid
    ).toBe(false);
  });

  test('refuses zero and negatives before the server does', () => {
    expect(checkPaymentAmount('0', payable()).valid).toBe(false);
    expect(checkPaymentAmount('-100', payable()).valid).toBe(false);
  });
});

describe('payablePaymentGate', () => {
  test('offers the action on an open payable to an admin', () => {
    const gate = payablePaymentGate({ payable: payable(), canManage: true });
    expect(gate.visible).toBe(true);
    expect(gate.enabled).toBe(true);
  });

  test('hides it from anyone without the role', () => {
    // Every mapping on PayableControllerWeb is behind system-admin, so a
    // button here could only ever 403.
    expect(
      payablePaymentGate({ payable: payable(), canManage: false }).visible
    ).toBe(false);
  });

  test('hides it on a settled payable', () => {
    const gate = payablePaymentGate({
      payable: payable({ amountPaid: 250_000, amountDue: 0 }),
      canManage: true,
    });
    expect(gate.visible).toBe(false);
  });

  test('says why a payable raised for nothing can never be paid', () => {
    // Any positive payment passes a recorded total of zero, so the server
    // refuses all of them. The row still looks payable, so it is told rather
    // than left to a 400.
    const gate = payablePaymentGate({
      payable: payable({ amountRecorded: 0, amountPaid: 0, amountDue: 0 }),
      canManage: true,
    });
    expect(gate.visible).toBe(true);
    expect(gate.enabled).toBe(false);
    expect(typeof gate.reason).toBe('string');
  });
});

describe('checkPayableDraft', () => {
  test('a complete draft has nothing to report', () => {
    expect(checkPayableDraft(draft(), asEmployee)).toEqual([]);
  });

  test('names every required field the backend would reject', () => {
    const problems = checkPayableDraft(
      draft({
        payableNumber: '  ',
        contractorName: '',
        contractType: '',
        amountRecorded: '',
        projectId: '',
      }),
      asEmployee
    );
    const fields = problems.map((problem) => problem.field);
    expect(fields).toContain('payableNumber');
    expect(fields).toContain('contractorName');
    expect(fields).toContain('contractType');
    expect(fields).toContain('amountRecorded');
    expect(fields).toContain('projectId');
  });

  test('holds the fields to the lengths the columns take', () => {
    const problems = checkPayableDraft(
      draft({
        payableNumber: 'P'.repeat(PAYABLE_NUMBER_MAX_LENGTH + 1),
        contractorName: 'C'.repeat(CONTRACTOR_NAME_MAX_LENGTH + 1),
      }),
      asEmployee
    );
    expect(problems.map((problem) => problem.field)).toEqual([
      'payableNumber',
      'contractorName',
    ]);
  });

  test('accepts the exact maximum lengths', () => {
    const problems = checkPayableDraft(
      draft({
        payableNumber: 'P'.repeat(PAYABLE_NUMBER_MAX_LENGTH),
        contractorName: 'C'.repeat(CONTRACTOR_NAME_MAX_LENGTH),
      }),
      asEmployee
    );
    expect(problems).toEqual([]);
  });

  test('refuses a payable number already on the screen', () => {
    // createPayable answers a duplicate with a 409, so a number the user can
    // see in the table is settled before the request goes out.
    const problems = checkPayableDraft(draft(), {
      ...asEmployee,
      takenNumbers: ['PAY-2026-0041', 'pay-2026-0042'],
    });
    expect(problems.map((problem) => problem.field)).toEqual(['payableNumber']);
  });

  test('refuses a contract type the enum does not carry', () => {
    // The column is EnumType.STRING, so anything else is a 400 out of the
    // converter.
    expect(
      checkPayableDraft(draft({ contractType: 'RETAINER' }), asEmployee).map(
        (problem) => problem.field
      )
    ).toEqual(['contractType']);
  });

  test('refuses a recorded amount that could never be settled', () => {
    // @NotNull is the only constraint on it server side, so zero is accepted
    // and produces a payable no payment can ever be recorded against.
    expect(
      checkPayableDraft(draft({ amountRecorded: '0' }), asEmployee).map(
        (problem) => problem.field
      )
    ).toEqual(['amountRecorded']);
  });

  test('refuses a recorded amount with a third decimal place', () => {
    expect(
      checkPayableDraft(draft({ amountRecorded: '1000.005' }), asEmployee).map(
        (problem) => problem.field
      )
    ).toEqual(['amountRecorded']);
  });

  test('refuses a user with no employee record in the organization', () => {
    // createdBy is an employee id validated against the employee repository,
    // so this is a 404 naming an id the user never chose.
    const problems = checkPayableDraft(draft(), { hasEmployeeRecord: false });
    expect(problems.map((problem) => problem.field)).toEqual(['createdBy']);
  });
});
