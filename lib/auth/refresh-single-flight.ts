/**
 * Server-side de-duplication for the Keycloak refresh-token exchange.
 *
 * Our realms run `revokeRefreshToken` with `refreshTokenMaxReuse` at 0, which
 * makes a refresh token single-use: the first exchange wins and a second
 * exchange of the same token is treated as a replay, so Keycloak revokes the
 * whole chain and the user is signed out everywhere.
 *
 * The cross-tab mutex in `session-refresh-lock.ts` only serialises the callers
 * that opt into it. It cannot reach the refreshes NextAuth starts on its own
 * (the `SessionProvider` visibility refetch), the ones the middleware starts on
 * a document request, or another device entirely. All of those land in the
 * `jwt()` callback in `auth.ts`, so that is where the exchange has to be made
 * safe rather than merely discouraged.
 *
 * Two callers arriving with the same refresh token are the same exchange, so
 * this module runs it once and hands both of them the result:
 *
 *   - concurrently, by sharing the in-flight promise;
 *   - just afterwards, by serving a short-lived cache of the result, because a
 *     request that read the cookie before the winner rewrote it still carries
 *     the spent token and would otherwise post it.
 *
 * Scope and its limit: this is per process. The compose staging runs a single
 * frontend container, so it is complete there. Under the Kubernetes HPA the
 * frontend scales to several replicas and two of them can still exchange the
 * same token, which is why the realm is also moving to `refreshTokenMaxReuse`
 * 2. On a realm still at 0 this module narrows the window, it does not close
 * it across replicas.
 */

/** How long a completed exchange stays available to late callers. */
export const RESULT_CACHE_TTL_MS = 30 * 1000;

/**
 * Most exchanges kept in the result cache at once.
 *
 * The cache exists to cover the milliseconds between one request rewriting the
 * cookie and another arriving with the copy it read beforehand, so it only ever
 * holds the handful of sessions rotating right now. The cap is a backstop that
 * keeps a burst from pinning token material in memory.
 */
export const RESULT_CACHE_MAX_ENTRIES = 200;

interface CachedResult<T> {
  value: T;
  expiresAt: number;
}

export interface RefreshSingleFlight<T> {
  /**
   * Runs `exchange` once for a given refresh token.
   *
   * @param key - The refresh token about to be spent. Callers holding the same
   *   one are the same exchange and share its outcome.
   * @param exchange - Performs the round trip to Keycloak.
   */
  run(key: string, exchange: () => Promise<T>): Promise<T>;
}

/**
 * Builds an independent de-duplicator.
 *
 * Each instance owns its own state so a test can exercise it without touching
 * the singleton the application shares.
 *
 * @param now - Clock source, injectable so cache expiry can be tested without
 *   waiting for real time to pass.
 */
export function createRefreshSingleFlight<T>(
  now: () => number = Date.now
): RefreshSingleFlight<T> {
  /** Exchanges currently in flight, keyed by the token being spent. */
  const inFlight = new Map<string, Promise<T>>();

  /** Recently completed exchanges, keyed by the token that was spent. */
  const completed = new Map<string, CachedResult<T>>();

  /** Drops entries whose time is up, so the cache cannot grow without bound. */
  function prune(at: number): void {
    for (const [key, entry] of completed) {
      if (entry.expiresAt <= at) {
        completed.delete(key);
      }
    }
  }

  /**
   * Records a result for late callers.
   *
   * Insertion order is iteration order for a Map, so the oldest entry is the
   * first one out when the cap is reached.
   */
  function remember(key: string, value: T, at: number): void {
    completed.set(key, { value, expiresAt: at + RESULT_CACHE_TTL_MS });

    while (completed.size > RESULT_CACHE_MAX_ENTRIES) {
      const oldest = completed.keys().next();
      if (oldest.done) break;
      completed.delete(oldest.value);
    }
  }

  async function run(key: string, exchange: () => Promise<T>): Promise<T> {
    const at = now();
    prune(at);

    const cached = completed.get(key);
    if (cached) {
      return cached.value;
    }

    const pending = inFlight.get(key);
    if (pending) {
      return pending;
    }

    // A failed exchange is deliberately not remembered. A transient failure has
    // to be retryable, and a rejected token is answered the same way on every
    // attempt anyway, so caching the rejection would buy nothing.
    const started = exchange()
      .then((value) => {
        remember(key, value, now());
        return value;
      })
      .finally(() => {
        inFlight.delete(key);
      });

    inFlight.set(key, started);
    return started;
  }

  return { run };
}
