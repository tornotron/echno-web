'use client';

import { UserCheck } from 'lucide-react';
import type { Attendance } from '@tornotron/echno-core/attendance/types';
import { markedByLabel } from '../lib/marked-by';

/**
 * One line under a day in a list: "Marked by Anand Rajashekar at 09:05".
 * Renders nothing when the employee marked every punch themselves.
 */
export function MarkedByNote({ attendance }: { attendance: Attendance }) {
  const label = markedByLabel(attendance);
  if (!label) return null;
  return (
    <p
      className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400"
      data-testid="marked-by"
    >
      <UserCheck className="h-3 w-3 shrink-0" />
      <span>{label}</span>
    </p>
  );
}
