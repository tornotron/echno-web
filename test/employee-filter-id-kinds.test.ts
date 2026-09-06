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

/**
 * How many times a helper is actually *called* in a file, ignoring the import
 * line and any mention in prose.
 *
 * A guard that substring-matches a name it also writes in its own comments
 * passes whatever the code does, which is the failure mode this file exists to
 * avoid in the app. Counting call sites is what makes the negative assertions
 * below mean something.
 */
function callCount(path: string, helper: string): number {
  const call = new RegExp(String.raw`\b${helper}\(`, 'g');
  return [...flat(path).matchAll(call)].length;
}

const STOCK_ADJUSTMENT_DETAIL =
  'app/users/dashboard/resources/stock-adjustments/[id]/page.tsx';
const PAYMENT_DETAIL = 'app/users/dashboard/finance/payments/[id]/page.tsx';
// The voucher's stamps moved off the route page into a feature component when
// the verify and cancel actions landed. The link is the same call; only the
// file it sits in changed, so the guard follows it rather than being dropped.
const PAYMENT_ATTRIBUTION =
  'features/payments/components/payment-attribution.tsx';
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
    expect(flat(PAYMENT_ATTRIBUTION)).toContain(
      "userFilterHref( routes.finance.payments.href, payment.verifiedBy, 'verifier' )"
    );
  });

  test('and its raiser is named without a link, on the same one-page reason', () => {
    // `raisedBy` is a user id like the verifier, so the link would be the right
    // kind. The destination is the problem: the payments list is one page of
    // twenty, so a raiser filter answers "raised by X" with whatever that page
    // held. Same reason the payee is named and not linked. echno-backend#638.
    const text = flat(PAYMENT_ATTRIBUTION);
    expect(text).toContain('userStampLabel(payment.raisedByName, payment.raisedBy)');
    expect(text).not.toContain("payment.raisedBy, 'raiser'");
  });
});

describe('payload and picker ids link as employee ids', () => {
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
});

describe('two people are named but not linked, because the list cannot answer', () => {
  /*
   * These are the ones where the id is right and the destination is not. A link
   * whose list cannot answer the question is worse than no link: it returns an
   * empty or truncated set under a chip asserting it is complete, and nothing
   * on the screen says otherwise.
   *
   * Both are counted rather than substring-matched. An assertion that a call is
   * absent, checked against a file that names the helper in its own comment
   * explaining why the call is absent, would pass no matter what the code did.
   */
  test('a regularization approver is not linked while the register is pending-only', () => {
    // `getPendingRegularizations` is `findByStatus(PENDING)`, and `approvedById`
    // is stamped by the same call that moves the row off PENDING. So the filter
    // is empty by construction: every click would land on nothing, under a chip
    // reading "Approved by X". echno-backend#637.
    const text = flat(REGULARIZATION_CARD);
    // The requester link on the same card stays, so this is one call, not none.
    expect(callCount(REGULARIZATION_CARD, 'employeeFilterHref')).toBe(1);
    expect(text).toContain("'requester'");
    expect(text).not.toContain("'approver'");
  });

  test('a payment payee is named but not linked while the list is one page', () => {
    // `GET /finance/construction-payments/web` returns a Spring `Page`, this
    // client sends no size, and Spring's default is twenty. Filtering those
    // would answer "paid to X" with whatever the first page held.
    // echno-backend#638.
    expect(callCount(PAYMENT_DETAIL, 'employeeFilterHref')).toBe(0);
    // The stamps moved to their own component; neither file may reach for the
    // employee directory with a user id.
    expect(callCount(PAYMENT_ATTRIBUTION, 'employeeFilterHref')).toBe(0);
    // Still named rather than numbered, which needs no list behind it.
    expect(flat(PAYMENT_DETAIL)).toContain(
      'payeeEmployee?.name ?? employeeReferenceLabel(payment.employeeId)'
    );
  });

  test('and the payments list grows no accessor for a link that is not there', () => {
    // The pair has to move together. An accessor with no link is dead; a link
    // with no accessor fails open, which is the worse half.
    const text = flat('app/users/dashboard/finance/payments/page.tsx');
    expect(text).not.toContain('payee: (p) => p.employeeId,');
    expect(text).toContain('verifier: (p) => p.verifiedBy,');
  });
});

describe('the reading lists carry an accessor for every role a link can set', () => {
  test('stock adjustments read the rejecter', () => {
    expect(
      flat('app/users/dashboard/resources/stock-adjustments/page.tsx')
    ).toContain('rejecter: (a) => a.rejectedBy,');
  });

  test('invitations read the manager', () => {
    const text = flat(
      'app/users/dashboard/workforce/employees/invitations/page.tsx'
    );
    expect(text).toContain(
      'roles: { manager: (i) => i.employeeDetails.managerId },'
    );
  });

  test('the team attendance history narrows before its fetch cap', () => {
    // Ordering, not presence. The history fetches one request per employee
    // capped at fifty, so a filter applied to the fetched rows would return
    // nothing for anybody outside the first fifty while still looking answered.
    const text = flat(
      'features/attendance/components/team-attendance-history.tsx'
    );
    expect(text).toContain(
      'const scopedEmployees = filterEmployeeId == null ? targetEmployees : targetEmployees.filter((e) => e.id === filterEmployeeId);'
    );
    expect(text).toContain(
      'const isCapped = scopedEmployees.length > MAX_PARALLEL_EMPLOYEES;'
    );
  });
});

/**
 * The chip is derived, not hand-guarded.
 *
 * Sixteen pages used to decide for themselves when to show it, on a condition
 * looser than the one that narrowed, and the seventeenth copy would have drifted
 * the same way. `useEmployeeFilterFromParams` now returns the chip's props, or
 * `null`, from the same `roles` map the narrowing comes from. This is the guard
 * against a page going back to writing its own condition: the props may only be
 * spread in, never assembled at the call site.
 */
describe('no page builds its own chip condition', () => {
  const CHIP_CALL_SITES = [
    'app/users/dashboard/finance/expenses/page.tsx',
    'app/users/dashboard/finance/invoices/page.tsx',
    'app/users/dashboard/finance/payments/page.tsx',
    'app/users/dashboard/finance/receipts/page.tsx',
    'app/users/dashboard/inspections/page.tsx',
    'app/users/dashboard/inspections/ncr/page.tsx',
    'app/users/dashboard/projects/all-issues/page.tsx',
    'app/users/dashboard/projects/all-tasks/page.tsx',
    'app/users/dashboard/resources/assets/page.tsx',
    'app/users/dashboard/resources/goods-receipts/page.tsx',
    'app/users/dashboard/resources/indents/page.tsx',
    'app/users/dashboard/resources/material-consumptions/page.tsx',
    'app/users/dashboard/resources/purchase-orders/page.tsx',
    'app/users/dashboard/resources/stock-adjustments/page.tsx',
    'app/users/dashboard/resources/transfers/page.tsx',
    'app/users/dashboard/workforce/employees/invitations/page.tsx',
    'features/attendance/components/regularization-management.tsx',
    'features/attendance/components/team-attendance-history.tsx',
    'features/leave/components/leave-requests-tabs/all-requests-tab.tsx',
  ];

  test('every list page spreads the chip the hook handed it', () => {
    const assembled = CHIP_CALL_SITES.filter(
      (path) => !flat(path).includes('<ActiveFilterChip {...')
    );
    expect(assembled).toEqual([]);
  });

  test('and none of them still writes a label or a name onto it', () => {
    // `label=` and `name=` on the chip are how the old condition was spelled;
    // the hook words both now, from the role it agreed to narrow on.
    const handWritten = CHIP_CALL_SITES.filter((path) =>
      /<ActiveFilterChip[^>]*\b(label|name)=/.test(flat(path))
    );
    expect(handWritten).toEqual([]);
  });

  test('and the fail-open row matcher is gone rather than left to be copied', () => {
    // `rowMatchesEmployeeFilter` matched everything for a role it had no
    // accessor for. That was survivable on its own; paired with a chip rendered
    // on a looser condition it stated the opposite of the truth. Deleting it is
    // what stops the pair being reassembled.
    expect(flat('hooks/use-employee-filter.ts')).not.toContain(
      'export function rowMatchesEmployeeFilter'
    );
  });
});
