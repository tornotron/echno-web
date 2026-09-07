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

  test('and its raiser is still named without a link, now only because nobody built it', () => {
    // `raisedBy` is a user id like the verifier, and the destination objection
    // has gone: echno-backend#655 gave the listing `raisedBy` alongside
    // `employeeId` and `verifiedBy`, and core 8.3.0 carries all three on
    // `ConstructionPaymentListParams`. So this is no longer held back by
    // anything. It is simply not built, and this pin records that rather than
    // pretending a blocker is still there. Adding it means a `raiser` entry in
    // the page's `roles` map and a `raisedBy` line in its params, at which
    // point this assertion is the one to flip.
    const text = flat(PAYMENT_ATTRIBUTION);
    expect(text).toContain(
      'userStampLabel(payment.raisedByName, payment.raisedBy)'
    );
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

describe('one person is named but not linked', () => {
  /*
   * The id is right and the destination is not, or was not. A link whose list
   * cannot answer the question is worse than no link: it returns an empty or
   * truncated set under a chip asserting it is complete, and nothing on the
   * screen says otherwise.
   *
   * Counted rather than substring-matched. An assertion that a call is absent,
   * checked against a file that names the helper in its own comment explaining
   * why the call is absent, would pass no matter what the code did.
   */
  test('a regularization approver is not linked, and the reason has changed', () => {
    // It used to be unbuildable: `getPendingRegularizations` is
    // `findByStatus(PENDING)` and `approvedById` is stamped by the same call
    // that moves the row off PENDING, so the filter was empty by construction.
    // echno-backend#655 settled that by widening the register rather than
    // adding a second endpoint, so a decided request is now reachable with
    // `approvedById` paired with `status`. What is left is a product call about
    // which screen the approver should land on, since the queue this card sits
    // beside still shows pending work only. Not built here.
    const text = flat(REGULARIZATION_CARD);
    // The requester link on the same card stays, so this is one call, not none.
    expect(callCount(REGULARIZATION_CARD, 'employeeFilterHref')).toBe(1);
    expect(text).toContain("'requester'");
    expect(text).not.toContain("'approver'");
  });
});

describe('a payment payee links to a register that can answer', () => {
  /*
   * This is the pair that moved. `employeeId` was always the right id and the
   * link was always the right kind; the register was the problem, because
   * `GET /finance/construction-payments/web` returns a Spring `Page` served
   * twenty rows deep and the client sent no size, so a browser-side filter
   * answered "paid to X" with whatever that page held. echno-backend#655 gave
   * the listing `employeeId`, `verifiedBy` and `raisedBy`, so the narrowing
   * moves onto the endpoint and the link follows it.
   */
  test('the detail screen links the payee as an employee', () => {
    expect(flat(PAYMENT_DETAIL)).toContain(
      "employeeFilterHref( routes.finance.payments.href, payment.employeeId, 'payee' )"
    );
  });

  test('and the voucher stamps beside it still link as user ids', () => {
    // Two kinds of id two cards apart, which is what makes this the screen
    // most likely to acquire the wrong helper by copy. The stamps live in
    // their own component and may never reach for the employee directory.
    expect(callCount(PAYMENT_ATTRIBUTION, 'employeeFilterHref')).toBe(0);
    expect(callCount(PAYMENT_DETAIL, 'userFilterHref')).toBe(0);
  });

  test('the list declares both roles with no accessor, so neither narrows in the browser', () => {
    // The whole point. An accessor here would filter the twenty rows the page
    // holds and put a chip over the result, which is the failure the endpoint
    // change exists to remove. Server narrowing is expressed by declaring the
    // role with no `match` and no `matches`.
    const text = flat('app/users/dashboard/finance/payments/page.tsx');
    expect(text).toContain('roles: { payee: {}, verifier: {}, },');
    expect(text).not.toContain('payee: (p) => p.employeeId,');
    expect(text).not.toContain('verifier: (p) => p.verifiedBy,');
  });

  test('and each role feeds the query parameter that matches its id kind', () => {
    // Crossing these is the defect the guard exists for: on a fresh database
    // the user and employee sequences run in lockstep, so a swap returns the
    // right rows under the right name until the two diverge.
    const text = flat('app/users/dashboard/finance/payments/page.tsx');
    expect(text).toContain(
      "employeeId: role === 'payee' ? (employeeId ?? undefined) : undefined,"
    );
    expect(text).toContain(
      "verifiedBy: role === 'verifier' ? (employeeId ?? undefined) : undefined,"
    );
    // The narrowed rows have to be the ones rendered. Handing the table an
    // array the hook filtered would put the browser back in the loop.
    expect(text).toContain(
      'const { data: payments = [], isLoading, isError } = usePayments(params);'
    );
    expect(text).toContain('<PaymentsTable payments={payments}');
  });

  test('the summary cards are withheld while a person filter is active', () => {
    // They count over the fetched rows, so under a filter they would describe
    // one payee beneath captions reading "all time", directly above a chip
    // naming that person. That is the same wrong-answer shape one step along.
    const text = flat('app/users/dashboard/finance/payments/page.tsx');
    expect(text).toContain('const narrowed = role != null;');
    expect(text).toContain('{!narrowed && ( <Card className="gap-0 p-6">');
  });

  test('and a filtered response cannot be served back as the unfiltered page', () => {
    // The params are part of the query key. Without them the narrowed response
    // would land in the cache slot the whole-page screen reads.
    const text = flat('hooks/payments/payment-keys.ts');
    expect(text).toContain(
      'list: (params: ConstructionPaymentListParams = {}) => [...paymentKeys.lists(), params] as const,'
    );
    // Still under `lists()`, so one prefix invalidation still clears them all.
    expect(flat('hooks/payments/use-payments.ts')).toContain(
      'queryKey: paymentKeys.list(params),'
    );
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
