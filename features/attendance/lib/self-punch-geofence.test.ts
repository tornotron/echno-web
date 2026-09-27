/**
 * The dialog's site-boundary rule has to be the server's (echno-web#504).
 *
 * Reproduced on echno.in: an employee 430 km from the site opened the dialog,
 * saw the distance, and got no reason field, because the dialog only applied
 * the fence when the profile had geolocationRequired set. The server measures
 * the fence on every punch that carries a position and refused the punch at
 * its 500 m boundary. These cases pin the rule to the server's.
 */
import { describe, expect, test } from 'bun:test';

import { ApiError } from '@/lib/api/api-client';
import type { AttendanceProfile } from '@tornotron/echno-core/attendance/types';

import {
  evaluateSelfPunchFence,
  readGeofenceReasonRequired,
  resolvePunchProfile,
} from './self-punch-geofence';

function profile(overrides: Partial<AttendanceProfile>): AttendanceProfile {
  return {
    id: 1,
    settingName: 'Profile',
    checkInOutCycles: 2,
    photoRequiredOnCheckIn: false,
    photoRequiredOnCheckOut: false,
    geolocationRequired: true,
    geofenceRadiusMeters: 100,
    ...overrides,
  } as AttendanceProfile;
}

describe('evaluateSelfPunchFence', () => {
  test('the reported case: 430 km out against a 500 m fence is outside', () => {
    expect(evaluateSelfPunchFence(430_254, 500)).toBe('outside');
  });

  test('does not depend on geolocationRequired, which the server ignores for the fence', () => {
    // The disagreement itself. The profile does not require geolocation, the
    // device still sent a position, and the server measured it.
    const optional = profile({
      geolocationRequired: false,
      geofenceRadiusMeters: 500,
    });
    expect(evaluateSelfPunchFence(430_254, optional.geofenceRadiusMeters)).toBe(
      'outside'
    );
  });

  test('a punch exactly on the radius is inside, as on the server', () => {
    expect(evaluateSelfPunchFence(500, 500)).toBe('inside');
  });

  test('rounds to the centimetre before comparing, as the server does', () => {
    expect(evaluateSelfPunchFence(500.004, 500)).toBe('inside');
    expect(evaluateSelfPunchFence(500.006, 500)).toBe('outside');
  });

  test('no distance or no radius is no verdict, never a violation', () => {
    expect(evaluateSelfPunchFence(null, 500)).toBe('unevaluated');
    expect(evaluateSelfPunchFence(430_254, null)).toBe('unevaluated');
    expect(evaluateSelfPunchFence(430_254, undefined)).toBe('unevaluated');
  });
});

describe('resolvePunchProfile', () => {
  const org = profile({ id: 1, geofenceRadiusMeters: 1_000_000 });
  const site = profile({ id: 2, geofenceRadiusMeters: 500 });

  test('the project settings the server resolves win over the organization default', () => {
    const resolved = resolvePunchProfile({
      projectSelected: true,
      projectSettings: site,
      projectSettingsFailed: false,
      orgSettings: org,
    });
    expect(resolved).toEqual({ profile: site, settled: true });
    // Judged by the organization default this punch would pass; by the
    // project's own settings, which is what the server applies, it is out.
    expect(evaluateSelfPunchFence(430_254, org.geofenceRadiusMeters)).toBe(
      'inside'
    );
    expect(
      evaluateSelfPunchFence(430_254, resolved.profile?.geofenceRadiusMeters)
    ).toBe('outside');
  });

  test('is not settled while the chosen project settings are loading', () => {
    expect(
      resolvePunchProfile({
        projectSelected: true,
        projectSettings: undefined,
        projectSettingsFailed: false,
        orgSettings: org,
      })
    ).toEqual({ profile: org, settled: false });
  });

  test('falls back to the preview when the project settings fail to load', () => {
    expect(
      resolvePunchProfile({
        projectSelected: true,
        projectSettings: undefined,
        projectSettingsFailed: true,
        orgSettings: org,
      })
    ).toEqual({ profile: org, settled: true });
  });

  test('uses the organization default as a preview before a project is chosen', () => {
    expect(
      resolvePunchProfile({
        projectSelected: false,
        projectSettings: undefined,
        projectSettingsFailed: false,
        orgSettings: org,
      })
    ).toEqual({ profile: org, settled: true });
  });
});

describe('readGeofenceReasonRequired', () => {
  const message =
    'This location is 430254 m from the project site, outside the 500 m site boundary. Give a reason to mark attendance from here; the record will be held for your reporting manager to approve.';

  test('reads the server refusal the dialog used to swallow', () => {
    const error = new ApiError(
      message,
      422,
      'uri=/api/v1/attendance/web/check-in',
      undefined,
      'Geofence Exception Reason Required',
      { distanceMeters: 430_254, geofenceRadiusMeters: 500, message }
    );
    expect(readGeofenceReasonRequired(error)).toEqual({
      message,
      radiusMeters: 500,
      distanceMeters: 430_254,
    });
  });

  test('ignores a 422 that is about something else', () => {
    const error = new ApiError(
      'Photo required',
      422,
      undefined,
      undefined,
      'x',
      {
        message: 'Photo required',
      }
    );
    expect(readGeofenceReasonRequired(error)).toBeNull();
  });

  test('ignores other statuses and non-API errors', () => {
    expect(
      readGeofenceReasonRequired(
        new ApiError('No', 403, undefined, undefined, undefined, {
          geofenceRadiusMeters: 500,
        })
      )
    ).toBeNull();
    expect(readGeofenceReasonRequired(new Error('offline'))).toBeNull();
  });
});
