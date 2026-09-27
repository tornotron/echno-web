/**
 * After a successful punch the page behind the dialog must show the day
 * without a reload (echno-web#505).
 */
import { describe, expect, test } from 'bun:test';
import { QueryClient } from '@tanstack/react-query';

import { attendanceKeys } from '@tornotron/echno-core/attendance/hooks/keys';
import type { Attendance } from '@tornotron/echno-core/attendance/types';

import { applyAcceptedPunch, upsertAttendance } from './today-record-cache';

function record(id: number, day: Date, employeeId = 7): Attendance {
  return { id, employeeId, date: day } as Attendance;
}

describe('upsertAttendance', () => {
  test('adds a record the list does not hold, which a first clock-in is', () => {
    const today = record(1, new Date(2026, 8, 27));
    expect(upsertAttendance([], today)).toEqual([today]);
  });

  test('replaces a record the list already holds', () => {
    const before = record(1, new Date(2026, 8, 27));
    const after = { ...before, remarks: 'clocked out' } as Attendance;
    expect(upsertAttendance([before], after)).toEqual([after]);
  });

  test('leaves an absent cache absent', () => {
    expect(upsertAttendance(undefined, record(1, new Date()))).toBeUndefined();
  });
});

describe('applyAcceptedPunch', () => {
  test('puts the new day into the lists covering it and refetches them', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const day = new Date(2026, 8, 27);
    const saved = record(41, day);

    const todayKey = attendanceKeys.byEmployee(7, '2026-09-27', '2026-09-27');
    const fortnightKey = attendanceKeys.byEmployee(
      7,
      '2026-09-13',
      '2026-09-27'
    );
    const lastMonthKey = attendanceKeys.byEmployee(
      7,
      '2026-08-01',
      '2026-08-31'
    );
    const otherEmployeeKey = attendanceKeys.byEmployee(
      8,
      '2026-09-27',
      '2026-09-27'
    );
    client.setQueryData(todayKey, []);
    client.setQueryData(fortnightKey, [record(40, new Date(2026, 8, 26))]);
    client.setQueryData(lastMonthKey, []);
    client.setQueryData(otherEmployeeKey, []);

    await applyAcceptedPunch(client, saved);

    expect(client.getQueryData(todayKey)).toEqual([saved]);
    expect(
      (client.getQueryData(fortnightKey) as Attendance[]).map((a) => a.id)
    ).toEqual([40, 41]);
    expect(client.getQueryData(lastMonthKey)).toEqual([]);
    expect(client.getQueryData(otherEmployeeKey)).toEqual([]);
    // Marked for a refetch, so what stays is the server's copy.
    expect(client.getQueryState(todayKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(otherEmployeeKey)?.isInvalidated).toBe(false);
  });
});
