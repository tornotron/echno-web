/**
 * The site-boundary rule for an employee marking their own attendance, stated
 * the way the server states it.
 *
 * The server decides whether a self-marked punch is outside the fence in
 * `AttendanceGeofenceService.evaluate` (tornotron/echno-backend#646), and a
 * punch it finds outside without a reason is refused with a 422. The dialog has
 * to reach the same verdict before the employee presses the button, or it hides
 * the reason field while the server demands one (echno-web#504). Three details
 * of the server's rule are easy to get wrong here:
 *
 * - **The settings.** The server resolves the effective settings for the
 *   project being marked (`AttendanceSettingsService.resolveEffectiveSettings`):
 *   the project's own active settings, else the organization default.
 *   `GET /attendance-settings/web/project/{id}` answers from that same
 *   resolver, so its response is the rule. The organization-level settings are
 *   only a preview for the moment before a project is chosen; using them as the
 *   rule for a project with its own settings is how the two sides disagree.
 * - **`geolocationRequired` does not switch the fence off.** It only decides
 *   whether a punch may be sent without a position. The fence is measured
 *   whenever the project has coordinates, the punch has a position and the
 *   settings a radius, which is every profile, since the radius is not
 *   nullable.
 * - **The comparison.** The distance is rounded to the centimetre and a punch
 *   exactly on the radius is inside.
 */
import { ApiError } from '@/lib/api/api-client';
import type { AttendanceProfile } from '@tornotron/echno-core/attendance/types';

/** Where a punch falls against the fence, or that it was not measured. */
export type FenceVerdict = 'inside' | 'outside' | 'unevaluated';

/**
 * Compares a measured distance with the fence radius, as the server does.
 *
 * @param distanceMeters - Distance from the project's marker, or null when
 *   there is no position or the project has no coordinates.
 * @param radiusMeters - The radius from the effective settings, or null or
 *   undefined while they are unknown.
 * @returns The verdict. `unevaluated` when either input is missing, which the
 *   server also treats as "no verdict" and never refuses.
 */
export function evaluateSelfPunchFence(
  distanceMeters: number | null,
  radiusMeters: number | null | undefined
): FenceVerdict {
  if (distanceMeters === null || radiusMeters == null) return 'unevaluated';
  const rounded = Math.round(distanceMeters * 100) / 100;
  return rounded <= radiusMeters ? 'inside' : 'outside';
}

/** The profile a punch is judged by, and whether it is known yet. */
export interface PunchProfile {
  /**
   * The settings to apply. For a chosen project, the server's resolution for
   * that project; before one is chosen, the organization default as a
   * preview. Null when neither has loaded.
   */
  profile: AttendanceProfile | null;
  /**
   * Whether the profile is the one the server will apply to this punch. False
   * while a chosen project's settings are still loading, when the preview
   * could still be overturned, so the punch should wait.
   */
  settled: boolean;
}

/**
 * Picks the settings a punch against the selected project is judged by.
 *
 * @param input.projectSelected - Whether a project is chosen or matched.
 * @param input.projectSettings - The project's effective settings from the
 *   server, once loaded.
 * @param input.projectSettingsFailed - Whether loading them failed. The punch
 *   is then let through on the preview, and a 422 from the server still brings
 *   up the reason field ({@link readGeofenceReasonRequired}).
 * @param input.orgSettings - The organization default, used as a preview.
 */
export function resolvePunchProfile(input: {
  projectSelected: boolean;
  projectSettings: AttendanceProfile | undefined;
  projectSettingsFailed: boolean;
  orgSettings: AttendanceProfile | undefined;
}): PunchProfile {
  const { projectSelected, projectSettings, projectSettingsFailed } = input;
  const orgSettings = input.orgSettings ?? null;
  if (!projectSelected) return { profile: orgSettings, settled: true };
  if (projectSettings) return { profile: projectSettings, settled: true };
  return { profile: orgSettings, settled: projectSettingsFailed };
}

/** The server's demand for a reason, read off its refusal. */
export interface GeofenceReasonDemand {
  /** The server's own sentence, with the distance and the radius in it. */
  message: string;
  /** The radius the server applied, in metres. */
  radiusMeters: number;
  /** The distance the server measured, in metres, when it sent one. */
  distanceMeters?: number;
}

/**
 * Recognises the refusal of a self-marked punch from outside the fence
 * without a reason (`GeofenceExceptionReasonRequiredException`, a 422 whose
 * problem carries `geofenceRadiusMeters` and `distanceMeters`).
 *
 * This is the backstop for any disagreement the rule above does not foresee:
 * the dialog shows the reason field on the server's word and the employee can
 * send the punch again, instead of being stuck behind a failure toast.
 *
 * @param error - Whatever the punch mutation threw.
 * @returns The demand, or null for any other failure.
 */
export function readGeofenceReasonRequired(
  error: unknown
): GeofenceReasonDemand | null {
  if (!(error instanceof ApiError) || error.status !== 422) return null;
  const radius = error.body?.geofenceRadiusMeters;
  if (typeof radius !== 'number') return null;
  const distance = error.body?.distanceMeters;
  return {
    message: error.message,
    radiusMeters: radius,
    distanceMeters: typeof distance === 'number' ? distance : undefined,
  };
}
