'use client';

import { useCallback } from 'react';
import { useEmployees } from '@tornotron/echno-core/employee/hooks';
import type { NcrDefect } from '@/types/inspection';

/**
 * Resolves the display name of an NCR's responsible party.
 *
 * The backend denormalises `responsibleName` onto the defect, but a defect
 * reassigned in this session carries only the new `responsibleId` until it is
 * refetched — and the stored name belongs to the previous holder. Preferring
 * the employee directory keeps every surface showing who is actually on the
 * hook, and the stored name remains the fallback for defects assigned to
 * someone outside the directory (a subcontractor, say).
 *
 * @returns A resolver, stable for as long as the employee list is.
 */
export function useResponsibleName() {
  const { data: employees = [] } = useEmployees();

  return useCallback(
    (defect: NcrDefect): string | undefined =>
      employees.find((employee) => employee.id === defect.responsibleId)
        ?.name ?? defect.responsibleName,
    [employees]
  );
}
