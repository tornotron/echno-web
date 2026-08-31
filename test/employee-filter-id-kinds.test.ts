/**
 * Which helper each "who did this" link is built with, checked against the kind
 * of id the field actually holds.
 *
 * `employeeFilterHref` writes `?employeeId=` and the reading list resolves the
 * name through the employee directory. `userFilterHref` writes `?userId=` and
 * the list names the person from the stamps its own rows carry. Picking the
 * wrong one does not fail: it produces a filter that compares an id from one
 * table against a column holding ids from another, so the list comes back empty
 * or, worse, names somebody who never touched the document.
 *
 * It is worth a source-reading guard rather than a rendering test because of
 * how it hides. **On a fresh database the user and employee sequences run in
 * lockstep**, so a mixed-up link returns exactly the right rows under exactly
 * the right name until enough rows exist on one side to push the two apart. A
 * test written against seeded data can pass on that coincidence. This one reads
 * the call site instead, so the coincidence cannot save it.
 *
 * The classification behind each entry, taken from the source rather than from
 * the field name:
 *
 * - **User ids** are the `*By` columns the backend stamps from the session with
 *   `UserContextService.getCurrentUserId()`. `types/resource/stock-adjustment.ts`
 *   says so above its approval block, and `ConstructionPayment.verifiedBy` is
 *   documented "User who verified the voucher".
 * - **Employee ids** come off a creation payload or a picker: a payment's
 *   `employeeId` sits with `vendorId`, `subContractId` and `labourId` as the
 *   payee, selected by `payeeType`; an invitation's `managerId` points into the
 *   employee directory, which is how `useManagerName` resolves it; an
 *   attendance record's `employeeId` is documented "Employee this record
 *   belongs to".
 * - **The trap in the same file** is stock adjustment's `physicalCountBy`,
 *   which looks like every other `*By` on that document and is not one. Its own
 *   comment calls it "the one *By field on this document that must NOT be run
 *   through the user directory". The last case pins it as a bare id.
 */
import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

function source(path: string): string {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

/**
 * Collapses whitespace so an assertion reads like the call rather than like the
 * formatter's line breaks.
 */
function flat(path: string): string {
  return source(path).replaceAll(/\s+/g, ' ');
}

const STOCK_ADJUSTMENT_DETAIL =
  'app/users/dashboard/resources/stock-adjustments/[id]/page.tsx';
const PAYMENT_DETAIL = 'app/users/dashboard/finance/payments/[id]/page.tsx';
const INVITATION_DETAIL =
  'app/users/dashboard/workforce/employees/invitations/[id]/page.tsx';
const ATTENDANCE_CARD =
  'features/attendance/components/attendance-employee-info-card.tsx';
const REGULARIZATION_CARD =
  'features/attendance/components/attendance-regularization-card.tsx';

describe('session stamps link as user ids', () => {
  test('a stock adjustment rejection links the rejecter as a user', () => {
    // submittedBy and approvedBy on the same document already did. rejectedBy
    // was the only decision on the approval block still rendering as text.
    expect(flat(STOCK_ADJUSTMENT_DETAIL)).toContain(
      "userFilterHref( routes.resources.stockAdjustments.href, adjustment.rejectedBy, 'rejecter' )"
    );
  });

  test('and its physical count stays a bare id, which is the trap', () => {
    // Same *By shape, different table. Turning it into a user link would name
    // whichever account happens to hold that employee's number.
    const text = flat(STOCK_ADJUSTMENT_DETAIL);
    expect(text).not.toContain('physicalCountBy, ');
    expect(text).not.toContain(
      'userFilterHref( routes, adjustment.physicalCountBy'
    );
  });

  test('a payment voucher links its verifier as a user', () => {
    expect(flat(PAYMENT_DETAIL)).toContain(
      "userFilterHref( routes.finance.payments.href, payment.verifiedBy, 'verifier' )"
    );
  });
});

describe('payload and picker ids link as employee ids', () => {
  test('a payment links its payee employee as an employee', () => {
    // The same screen carries both kinds, two cards apart, which is why it is
    // the one most likely to acquire the wrong helper by copy.
    expect(flat(PAYMENT_DETAIL)).toContain(
      "employeeFilterHref( routes.finance.payments.href, payment.employeeId, 'payee' )"
    );
  });

  test('an invitation links its reporting manager as an employee', () => {
    expect(flat(INVITATION_DETAIL)).toContain(
      "employeeFilterHref( routes.workforce.employees.invitations.href, invitation.employeeDetails.managerId, 'manager' )"
    );
  });

  test('an attendance record links the employee it belongs to', () => {
    expect(flat(ATTENDANCE_CARD)).toContain(
      "employeeFilterHref( `${routes.attendance.history}?tab=team`, attendance.employeeId, 'employee' )"
    );
  });

  test('a regularization links its approver by id, not by the name beside it', () => {
    // approvedBy on this object is a display string. The link has to be built
    // from approvedById, and the list already filters on that column.
    const text = flat(REGULARIZATION_CARD);
    expect(text).toContain(
      "employeeFilterHref( routes.attendance.regularizations, regApprovedById, 'approver' )"
    );
    expect(text).toContain(
      'const regApprovedById = attendance.regularization?.approvedById;'
    );
  });
});

describe('the reading lists carry an accessor for every role a link can set', () => {
  test('stock adjustments read the rejecter', () => {
    expect(
      flat('app/users/dashboard/resources/stock-adjustments/page.tsx')
    ).toContain('rejecter: (a) => a.rejectedBy,');
  });

  test('payments read the payee beside the verifier', () => {
    // A link with no accessor behind it fails open: rowMatchesEmployeeFilter
    // returns true for an unknown role, so the chip appears over an unfiltered
    // list and reads as "everything this person did".
    const text = flat('app/users/dashboard/finance/payments/page.tsx');
    expect(text).toContain('verifier: (p) => p.verifiedBy,');
    expect(text).toContain('payee: (p) => p.employeeId,');
  });

  test('invitations read the manager', () => {
    expect(
      flat('app/users/dashboard/workforce/employees/invitations/page.tsx')
    ).toContain('manager: (i) => i.employeeDetails.managerId,');
  });

  test('the team attendance history narrows before its fetch cap', () => {
    // Ordering, not presence. The history fetches one request per employee
    // capped at fifty, so a filter applied to the fetched rows would return
    // nothing for anybody outside the first fifty while still looking answered.
    const text = flat(
      'features/attendance/components/team-attendance-history.tsx'
    );
    expect(text).toContain(
      'const scopedEmployees = employeeFilterApplies ? targetEmployees.filter((e) => e.id === filterEmployeeId) : targetEmployees;'
    );
    expect(text).toContain(
      'const isCapped = scopedEmployees.length > MAX_PARALLEL_EMPLOYEES;'
    );
  });

  test('and shows its chip only for the role it actually applies', () => {
    // One predicate decides both, so a link carrying another module's role
    // cannot produce a chip naming somebody the list was never narrowed to.
    const text = flat(
      'features/attendance/components/team-attendance-history.tsx'
    );
    expect(text).toContain(
      "const employeeFilterApplies = filterEmployeeId != null && filterRole === 'employee';"
    );
    expect(text).toContain('{employeeFilterApplies && filterName && (');
  });
});
