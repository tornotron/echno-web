/**
 * Reading the device's position for attendance, shared by the self-marking
 * dialog and the Mark for Team screen.
 *
 * Attendance is verified against the site the person is standing on, so a bare
 * "location unavailable" leaves them with nothing to act on. Each failure kind
 * carries its own explanation and its own next step, and the decision of what
 * to do next is a pure function so it can be tested without a browser.
 */
import type { GeoLocation } from '@tornotron/echno-core/attendance/types';

/**
 * Why the browser would not give us a position. Attendance is verified against
 * the site the employee is standing on, so a bare "location unavailable" leaves
 * them with nothing to act on. Each kind carries its own explanation and its own
 * next step.
 */
export type LocationErrorKind =
  | 'unsupported'
  | 'insecure'
  | 'permission-required'
  | 'permission-denied'
  | 'position-unavailable'
  | 'timeout'
  | 'failed';

export type LocationState =
  | { status: 'idle' }
  | { status: 'detecting' }
  | { status: 'detected'; location: GeoLocation }
  | { status: 'error'; kind: LocationErrorKind };

// ─── Location copy ────────────────────────────────────────────────────────────

/**
 * What the screen says for each failure, and what it offers the employee next.
 * `allow` renders the button that triggers the browser's permission prompt;
 * `retry` re-reads the permission and asks for a position again; `none` is for
 * the cases the employee cannot fix from this screen.
 */
export const LOCATION_ERROR_COPY: Record<
  LocationErrorKind,
  { title: string; body: string; action: 'allow' | 'retry' | 'none' }
> = {
  unsupported: {
    title: 'Location is not available on this device',
    body: 'This browser cannot report a location, so attendance cannot be verified here. Open Echno in a current version of Chrome, Safari, Edge or Firefox.',
    action: 'none',
  },
  insecure: {
    title: 'Location needs a secure connection',
    body: 'Browsers only share a location over HTTPS. Open Echno on its https:// address, then select Retry.',
    action: 'retry',
  },
  'permission-required': {
    title: 'Location access required',
    body: 'Your location is needed to verify that you are checking in from the permitted work location. It is read once, when you mark attendance.',
    action: 'allow',
  },
  'permission-denied': {
    title: 'Location permission is blocked',
    body: 'Echno was refused access to your location. Enable Location for this site in your browser or device settings, then return here and select Retry.',
    action: 'retry',
  },
  'position-unavailable': {
    title: 'Your location could not be determined',
    body: 'Your device could not get a fix. Check that location services are switched on, move somewhere with a clearer view of the sky, then select Retry.',
    action: 'retry',
  },
  timeout: {
    title: 'Location request timed out',
    body: 'Your device took too long to report a position. Stay on this screen and select Retry.',
    action: 'retry',
  },
  failed: {
    title: 'Location could not be read',
    body: 'Something went wrong while reading your location. Select Retry to try again.',
    action: 'retry',
  },
};

/**
 * Decides what the dialog does next, given what it already knows about the
 * environment and the browser's standing permission. Split out from the
 * component so the rule can be read and tested on its own.
 *
 * A blocker beats everything, because no permission can rescue a browser with
 * no Geolocation API or a page on plain HTTP. A denied permission is reported
 * rather than re-requested: browsers do not re-prompt, so calling
 * `getCurrentPosition` again would only reproduce the same failure. An
 * unresolved permission stops at an explanation on the automatic pass and goes
 * through to the prompt once the employee asks for it, so the prompt never
 * appears without a reason beside it. A granted permission, and a browser with
 * no Permissions API to ask, go straight to the position request.
 *
 * @param blocker - Environment failure found without asking the browser, or null.
 * @param permission - The browser's standing decision, or null when unreadable.
 * @param userInitiated - Whether this pass came from the employee's own click.
 */
export function nextLocationStep(
  blocker: LocationErrorKind | null,
  permission: PermissionState | null,
  userInitiated: boolean
): { status: 'detecting' } | { status: 'error'; kind: LocationErrorKind } {
  if (blocker) return { status: 'error', kind: blocker };
  if (permission === 'denied') {
    return { status: 'error', kind: 'permission-denied' };
  }
  if (permission === 'prompt' && !userInitiated) {
    return { status: 'error', kind: 'permission-required' };
  }
  return { status: 'detecting' };
}

/**
 * Whether the dialog has everything it needs from the browser to record an
 * event.
 *
 * A profile with `geolocationRequired` set has to have a position, because the
 * event is verified against the site the employee is standing on and there is
 * nothing to verify without coordinates. A profile without it only waits while
 * the attempt is still in flight, and goes ahead once the attempt has settled
 * one way or the other, so a refused or unavailable position stops being fatal
 * on the profiles that never asked for one. `idle` and `detecting` are both
 * still in flight.
 *
 * @param status - Where the location attempt has got to.
 * @param geolocationRequired - The effective profile's flag.
 */
export function isLocationSettled(
  status: LocationState['status'],
  geolocationRequired: boolean
): boolean {
  if (status === 'detected') return true;
  if (geolocationRequired) return false;
  return status === 'error';
}

/**
 * The failure the page can determine on its own, before the browser is asked
 * for anything: no Geolocation API at all, or a page served over plain HTTP,
 * where every browser refuses geolocation regardless of the permission.
 */
export function detectLocationBlocker(): LocationErrorKind | null {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return 'unsupported';
  }
  // Undefined on the server, where there is nothing to decide; only an explicit
  // false means the page really is on an origin the browser calls insecure.
  if (globalThis.isSecureContext === false) {
    return 'insecure';
  }
  return null;
}

/**
 * Reads the browser's standing decision for geolocation without asking for a
 * position, which is what lets the dialog tell "never asked" apart from
 * "blocked". Returns null where the Permissions API is missing or refuses the
 * query (older Safari, some in-app webviews); the caller then falls back to
 * asking for a position and reading the error code that comes back.
 */
export async function readGeolocationPermission(): Promise<PermissionState | null> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return null;
  }
  try {
    const status = await navigator.permissions.query({
      name: 'geolocation' as PermissionName,
    });
    return status.state;
  } catch {
    return null;
  }
}

/**
 * Maps a `GeolocationPositionError` to the failure kind the copy table knows.
 */
export function locationErrorKind(
  err: GeolocationPositionError
): LocationErrorKind {
  switch (err.code) {
    case err.PERMISSION_DENIED: {
      return 'permission-denied';
    }
    case err.POSITION_UNAVAILABLE: {
      return 'position-unavailable';
    }
    case err.TIMEOUT: {
      return 'timeout';
    }
    default: {
      return 'failed';
    }
  }
}

/**
 * Asks the browser for one position and resolves it as a {@link GeoLocation}.
 *
 * Rejects with a {@link LocationErrorKind} rather than the browser's own error
 * so a caller can put the failure straight into a {@link LocationState}.
 * Assumes `navigator.geolocation` exists: run {@link detectLocationBlocker}
 * first.
 */
export function readCurrentPosition(): Promise<GeoLocation> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude ?? undefined,
        });
      },
      (err) => reject(locationErrorKind(err)),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 }
    );
  });
}

export function formatCoord(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}°${latDir}, ${Math.abs(lng).toFixed(5)}°${lngDir}`;
}
