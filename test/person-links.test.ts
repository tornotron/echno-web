/**
 * The three person links that waited on a screen decision (#421), plus the
 * payment raiser. Each pins the destination and the params the link carries,
 * so the convention set here is not undone by a later edit that keeps the
 * name and drops the href.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
  approverRegisterHref,
  registerStatusFromParam,
} from '@/features/attendance/components/regularization-register-card';
import {
  REGISTER_PAGE_SIZE,
  registerQuery,
  registerQueryKey,
} from '@/hooks/attendance/use-regularization-register';
import { attendanceRegularizationKeys } from '@tornotron/echno-core/attendance-regularization/hooks';

function flat(path: string): string {
  return readFileSync(
    new URL(`../${path}`, import.meta.url),
    'utf8'
  ).replaceAll(/\s+/g, ' ');
}

describe("a roster name opens that member's tasks on this project", () => {
  test('the link is the project task list narrowed to the assignee', () => {
    const text = flat('features/projects/components/team-members-section.tsx');
    expect(text).toContain(
      "employeeFilterHref( routes.projects.allProjects.detail(projectId).tasks .href, employee.id, 'assignee' )"
    );
  });

  test('and that task list declares the assignee role it is narrowed by', () => {
    const page = flat(
      'app/users/dashboard/projects/all-projects/[id]/tasks/page.tsx'
    );
    expect(page).toContain('assignee: {');
  });
});

describe('a regularization approver opens the decided tab of the queue', () => {
  test('the href carries the tab, the outcome and the approver', () => {
    expect(approverRegisterHref(7, 'approved')).toBe(
      '/users/dashboard/attendance/regularizations?tab=decided&status=approved&employeeId=7&role=approver'
    );
    expect(approverRegisterHref(7, 'rejected')).toContain('status=rejected');
  });

  test('the outcome param maps onto the register enum and nothing else', () => {
    expect(registerStatusFromParam('approved')).toBe('APPROVED');
    expect(registerStatusFromParam('rejected')).toBe('REJECTED');
    expect(registerStatusFromParam('pending')).toBeUndefined();
    expect(registerStatusFromParam(null)).toBeUndefined();
  });

  test('the register is asked for one large page, unset filters not sent', () => {
    expect(registerQuery({ status: 'APPROVED', approvedById: 7 })).toEqual({
      pageNo: 0,
      pageSize: REGISTER_PAGE_SIZE,
      status: 'APPROVED',
      approvedById: 7,
    });
    expect(registerQuery({})).toEqual({
      pageNo: 0,
      pageSize: REGISTER_PAGE_SIZE,
    });
  });

  test("the register query lives under core's regularization key prefix", () => {
    const key = registerQueryKey({ approvedById: 7 });
    expect(key.slice(0, attendanceRegularizationKeys.all.length)).toEqual([
      ...attendanceRegularizationKeys.all,
    ]);
    expect(key[1]).toBe('register');
  });

  test('the attendance card links the approver stamp to that href', () => {
    const card = flat(
      'features/attendance/components/attendance-regularization-card.tsx'
    );
    expect(card).toContain(
      'approverRegisterHref( regApprovedById, attendance.regularization.status )'
    );
  });

  test('the queue declares the approver role only on the decided tab', () => {
    const queue = flat(
      'features/attendance/components/regularization-management.tsx'
    );
    expect(queue).toContain(
      "tab === 'decided' ? { requester: {}, approver: {} } : { requester: (row) => row.requestedById }"
    );
  });
});

describe('a reporting manager opens the directory narrowed to their reports', () => {
  test('the profile links the manager name with the manager role', () => {
    const tab = flat('features/employee/components/employee-overview-tab.tsx');
    expect(tab).toContain(
      "employeeFilterHref( routes.workforce.employees.employeeManagement.href, employee.managerId, 'manager' )"
    );
  });

  test('the directory reads that filter and fetches the reports whole', () => {
    const page = flat(
      'app/users/dashboard/workforce/employees/employee-management/page.tsx'
    );
    expect(page).toContain('roles: { manager: {} }');
    expect(page).toContain('useSubordinates(managerId ?? undefined)');
  });
});
