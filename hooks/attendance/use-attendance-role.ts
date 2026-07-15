/**
 * hooks/attendance/use-attendance-role.ts
 *
 * Web auth-binding adapter for attendance role resolution.
 *
 * The role-resolution policy (Admin > Manager > Employee + permission flags)
 * lives in echno-core as the pure `resolveAttendanceRole` function so it can
 * be shared across platforms and unit-tested in isolation. This hook stays in
 * echno-web because it sources the role flags from the next-auth session
 * (via `useAuthorization`) — authentication is not part of echno-core.
 *
 * The enum and return-shape interface are also defined in echno-core
 * (`@tornotron/echno-core/attendance/types`).
 */

import { useMemo } from 'react';
import {
  resolveAttendanceRole,
  type AttendanceRoleContext,
} from '@tornotron/echno-core/attendance/types';
import { useAuthorization } from '@/hooks/use-authorization';

export function useAttendanceRole(): AttendanceRoleContext {
  const { isAdmin, isManagerOrAbove, isLoading } = useAuthorization();

  return useMemo(
    () => resolveAttendanceRole({ isAdmin, isManagerOrAbove, isLoading }),
    [isAdmin, isManagerOrAbove, isLoading]
  );
}
