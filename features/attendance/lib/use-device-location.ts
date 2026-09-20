'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  detectLocationBlocker,
  nextLocationStep,
  readCurrentPosition,
  readGeolocationPermission,
  type LocationErrorKind,
  type LocationState,
} from './device-location';

/**
 * The device position for a screen that records attendance, resolved the way
 * the self-marking dialog resolves it.
 *
 * The mount pass reads the browser's standing permission first and stops at an
 * explanation when the browser has never been asked, so the prompt never
 * appears without a reason beside it. `allow` and `retry` carry a user gesture
 * and go through to the prompt. A denied permission is reported, not
 * re-requested, since browsers do not re-prompt.
 *
 * @returns The current {@link LocationState} and the two actions the
 *   {@link LocationStatus} card offers.
 */
export function useDeviceLocation() {
  const [state, setState] = useState<LocationState>(() => {
    const blocker = detectLocationBlocker();
    return blocker ? { status: 'error', kind: blocker } : { status: 'idle' };
  });

  const resolve = useCallback((userInitiated: boolean) => {
    void readGeolocationPermission().then((permission) => {
      const step = nextLocationStep(
        detectLocationBlocker(),
        permission,
        userInitiated
      );
      setState(step);
      if (step.status !== 'detecting') return;
      readCurrentPosition().then(
        (location) => setState({ status: 'detected', location }),
        (error: LocationErrorKind) => setState({ status: 'error', kind: error })
      );
    });
  }, []);

  useEffect(() => {
    if (state.status !== 'idle') return;
    resolve(false);
  }, [state.status, resolve]);

  const allow = useCallback(() => resolve(true), [resolve]);
  const retry = useCallback(() => resolve(true), [resolve]);

  return { state, allow, retry };
}
