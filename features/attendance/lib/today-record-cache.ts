/**
 * Puts a punch the server just accepted onto the screens that show the day.
 *
 * The Mark Attendance page and the employee dashboard both read the day from
 * the employee's date-range list (`attendanceKeys.byEmployee`). After a
 * successful clock-in the page was seen still showing "Start your day" until a
 * reload (echno-web#505). The package's mutation hooks only invalidate those
 * lists (clock-in) or patch rows already in them (later events), so the page
 * depends on a background refetch nobody waits for, and a first punch creates
 * a row no cached list holds yet, so there is nothing to patch in place.
 *
 * {@link applyAcceptedPunch} writes the record the server returned into every
 * cached list of that employee whose range covers the record's day, inserting
 * it when the list has no row for it, so the page changes the moment the
 * dialog closes. It then refetches those lists and resolves once they are back,
 * so what stays on screen is the server's answer rather than the local copy.
 */
import type { QueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { attendanceKeys } from '@tornotron/echno-core/attendance/hooks/keys';
import type { Attendance } from '@tornotron/echno-core/attendance/types';

/** The prefix every date-range list of one employee sits under. */
function employeeListsPrefix(employeeId: number) {
  return [...attendanceKeys.all, 'employee', employeeId] as const;
}

/**
 * Whether a cached employee list's key covers the given day.
 *
 * The key is `['attendance', 'employee', employeeId, startDate, endDate]` with
 * both dates as `yyyy-MM-dd`, which compare correctly as strings.
 */
function keyCoversDay(key: readonly unknown[], day: string): boolean {
  const start = key[3];
  const end = key[4];
  return (
    typeof start === 'string' &&
    typeof end === 'string' &&
    start <= day &&
    day <= end
  );
}

/**
 * Replaces the record in a list, or adds it when the list has no row for it.
 *
 * @param list - The cached list, or undefined when nothing is cached.
 * @param record - The record the server returned.
 * @returns The new list, or undefined to leave an absent cache absent.
 */
export function upsertAttendance(
  list: Attendance[] | undefined,
  record: Attendance
): Attendance[] | undefined {
  if (!Array.isArray(list)) return list;
  if (list.some((a) => a.id === record.id)) {
    return list.map((a) => (a.id === record.id ? record : a));
  }
  return [...list, record];
}

/**
 * Writes an accepted punch into the employee's cached day lists and refetches
 * them.
 *
 * @param queryClient - The app's query client.
 * @param record - The attendance record the punch endpoint returned.
 * @returns Resolves once the lists have been refetched.
 */
export async function applyAcceptedPunch(
  queryClient: QueryClient,
  record: Attendance
): Promise<void> {
  const prefix = employeeListsPrefix(record.employeeId);
  const day = format(record.date, 'yyyy-MM-dd');

  for (const query of queryClient
    .getQueryCache()
    .findAll({ queryKey: prefix })) {
    if (!keyCoversDay(query.queryKey, day)) continue;
    queryClient.setQueryData<Attendance[]>(query.queryKey, (old) =>
      upsertAttendance(old, record)
    );
  }

  await queryClient.invalidateQueries({ queryKey: prefix });
}
