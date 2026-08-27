/**
 * Cross-tab coordination for the session refresh.
 *
 * Every tab on this origin shares one session cookie, so every tab computes the
 * same refresh deadline and wakes within milliseconds of the others. Our realms
 * run `revokeRefreshToken` with `refreshTokenMaxReuse: 0`, which makes a refresh
 * token single-use: the first exchange wins and every other one is a reuse of a
 * spent token, so Keycloak revokes the chain and signs the user out everywhere.
 *
 * The Web Locks API is a same-origin mutex shared by every tab, which is exactly
 * the primitive needed. Serialising is enough on its own: the `jwt()` callback
 * in `auth.ts` only exchanges when the token is inside its refresh buffer, so
 * the tab that acquires the lock second reads an `expiresAt` its peer has
 * already advanced and returns without exchanging anything.
 *
 * `navigator.locks` needs a secure context and is missing from a few older
 * browsers. There it degrades to a per-tab queue, which is the behaviour we had
 * before the lock rather than an error.
 */

/** Name of the same-origin lock every refresh path contends for. */
const SESSION_REFRESH_LOCK = 'echno:session-refresh';

/**
 * Settles a promise without caring how it went, so a queue can move on.
 * A failed refresh is the caller's to handle, not the queue's.
 */
const ignoreOutcome = () => {};

/**
 * The Web Locks manager, or null when the browser will not give us one.
 *
 * Feature-detected on every call rather than once at module load, because the
 * module is evaluated on the server too, where there is no `navigator` at all.
 */
function getLockManager(): LockManager | null {
  if (typeof navigator === 'undefined') {
    return null;
  }

  const locks = (navigator as Navigator & { locks?: LockManager }).locks;
  return typeof locks?.request === 'function' ? locks : null;
}

/**
 * Coordinates the session refresh for one tab.
 *
 * Two entry points refresh the session and both must contend for the same lock,
 * otherwise they can still collide across tabs even though each is serialised on
 * its own: the scheduled timer in `SessionMonitor` and the recovery path in
 * `ApiClient.fetchWithRetry`.
 */
export interface SessionRefreshCoordinator {
  /**
   * Runs `refresh` with no other refresh in flight anywhere on this origin.
   *
   * Used by callers that must run their own work, such as the provider's
   * `update()`, which has to write the refreshed session into React state.
   */
  refreshExclusive<T>(refresh: () => Promise<T>): Promise<T>;

  /**
   * Runs `refresh` once for everyone who asks while it is still in flight.
   *
   * Used by the API client, where a whole page of parallel queries can hit the
   * expiry signal in the same instant and only one refresh should follow.
   */
  refreshOnce(refresh: () => Promise<unknown>): Promise<void>;
}

/**
 * Builds an independent coordinator.
 *
 * Each instance owns its own in-flight state, so a test can stand two of them up
 * to model two tabs. Application code shares the {@link sessionRefresh}
 * singleton below.
 */
export function createSessionRefreshCoordinator(): SessionRefreshCoordinator {
  /** The refresh being shared with late callers, if any. */
  let inFlight: Promise<unknown> | null = null;

  /** Tail of the fallback queue used when there is no Web Locks API. */
  let fallbackQueue: Promise<unknown> = Promise.resolve();

  function refreshExclusive<T>(refresh: () => Promise<T>): Promise<T> {
    const locks = getLockManager();
    if (locks) {
      return locks.request(SESSION_REFRESH_LOCK, refresh) as Promise<T>;
    }

    // No Web Locks: serialise within this tab at least, so the paths that share
    // this coordinator cannot overlap. Both arms of `then` continue the queue,
    // so one failed refresh does not wedge every refresh after it.
    const result = fallbackQueue.then(refresh, refresh);
    fallbackQueue = result.then(ignoreOutcome, ignoreOutcome);
    return result;
  }

  async function refreshOnce(refresh: () => Promise<unknown>): Promise<void> {
    inFlight ??= refreshExclusive(refresh).finally(() => {
      inFlight = null;
    });

    await inFlight;
  }

  return { refreshExclusive, refreshOnce };
}

/** The coordinator every refresh path in the app shares. */
export const sessionRefresh = createSessionRefreshCoordinator();
