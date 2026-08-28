'use client';

import { useCallback } from 'react';
import { useEmployees } from '@tornotron/echno-core/employee/hooks';

/**
 * Resolves an employee id to a display name against the employee directory.
 *
 * The NCR carries only `siteEngineerId`, with no denormalised name alongside
 * it, so every surface that shows who is accountable has to look the name up.
 * Doing it from the directory rather than from the row also means a
 * reassignment shows the new holder straight away, without waiting for a
 * refetch.
 *
 * Returns `undefined` for an id the directory does not hold, which is the
 * signal to fall back to showing nothing rather than a bare number.
 *
 * @returns A resolver, stable for as long as the employee list is.
 */
export function useResponsibleName() {
  const { data: employees = [] } = useEmployees();

  return useCallback(
    (employeeId?: number | null): string | undefined =>
      employeeId == null
        ? undefined
        : employees.find((employee) => employee.id === employeeId)?.name,
    [employees]
  );
}
