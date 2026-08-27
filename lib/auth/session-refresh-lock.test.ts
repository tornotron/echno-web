import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createSessionRefreshCoordinator } from './session-refresh-lock';
import { TOKEN_REFRESH } from './constants';

const ACCESS_TOKEN_LIFETIME_MS = 5 * 60 * 1000;

/** Settles a promise without caring how it went. */
const ignoreOutcome = () => {};

/** A refresh that always fails, for the failure paths below. */
const failingRefresh = async (): Promise<never> => {
  throw new Error('refresh failed');
};

/**
 * Stands in for the session cookie, the `jwt()` callback in auth.ts, and a
 * Keycloak realm running revokeRefreshToken with refreshTokenMaxReuse 0.
 *
 * `refreshToken` is the serial of the only refresh token the realm will accept.
 * A caller posting an older serial is reusing a spent token, which is what makes
 * the realm revoke the whole chain and sign the user out of every tab.
 */
const keycloak = {
  expiresAt: 0,
  refreshToken: 1,
  exchanges: 0,
  calls: 0,
  /** Set when a spent refresh token was replayed, so the chain is revoked. */
  revoked: false,
  /** Highest number of round trips ever overlapping, to catch lost mutexes. */
  peakConcurrency: 0,
  inProgress: 0,
};

/**
 * One `getSession()` / `update()` round trip.
 *
 * The cookie is read when the request goes out, not when the response comes
 * back, so the tokens a caller posts are whatever it saw at the start. That is
 * the whole race: two tabs that start together both post the same refresh
 * token, and the loser's post is a reuse. The early return mirrors the callback,
 * which exchanges only when the token it read is inside its refresh buffer.
 */
async function runJwtCallback(): Promise<void> {
  const cookie = {
    expiresAt: keycloak.expiresAt,
    refreshToken: keycloak.refreshToken,
  };

  keycloak.calls++;
  keycloak.inProgress++;
  keycloak.peakConcurrency = Math.max(
    keycloak.peakConcurrency,
    keycloak.inProgress
  );

  // Let anything else that is ready run, the way a network round trip would.
  await new Promise((resolve) => setTimeout(resolve, 5));
  keycloak.inProgress--;

  const now = 0;
  if (now < cookie.expiresAt - TOKEN_REFRESH.REFRESH_BUFFER_MS) {
    return; // Still valid on the copy this caller read: no exchange.
  }

  if (cookie.refreshToken !== keycloak.refreshToken) {
    keycloak.revoked = true; // Reuse of a spent token.
    return;
  }

  keycloak.exchanges++;
  keycloak.refreshToken++;
  keycloak.expiresAt = now + ACCESS_TOKEN_LIFETIME_MS;
}

/**
 * Minimal stand-in for the Web Locks API: a same-origin mutex per lock name.
 * Every coordinator in a test shares this one manager, exactly as every tab on
 * an origin shares the browser's.
 */
function installFakeLockManager(): void {
  const tails = new Map<string, Promise<unknown>>();
  const locks = {
    request: (name: string, callback: () => Promise<unknown>) => {
      const tail = tails.get(name) ?? Promise.resolve();
      const result = tail.then(
        () => callback(),
        () => callback()
      );
      tails.set(name, result.then(ignoreOutcome, ignoreOutcome));
      return result;
    },
  };

  Object.defineProperty(navigator, 'locks', {
    value: locks,
    configurable: true,
    writable: true,
  });
}

/** Removes the Web Locks API, as an insecure context or old browser would. */
function removeLockManager(): void {
  Object.defineProperty(navigator, 'locks', {
    value: undefined,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  keycloak.expiresAt = TOKEN_REFRESH.REFRESH_BUFFER_MS; // due for refresh now
  keycloak.refreshToken = 1;
  keycloak.exchanges = 0;
  keycloak.calls = 0;
  keycloak.revoked = false;
  keycloak.peakConcurrency = 0;
  keycloak.inProgress = 0;
});

afterEach(() => {
  removeLockManager();
});

describe('across tabs, behind the Web Locks mutex', () => {
  test('two tabs waking on the same deadline exchange the token once', () => {
    installFakeLockManager();
    // Two coordinators, one per tab. They share nothing but the lock manager
    // and the cookie the fake realm stands for.
    const tabA = createSessionRefreshCoordinator();
    const tabB = createSessionRefreshCoordinator();

    return Promise.all([
      tabA.refreshExclusive(runJwtCallback),
      tabB.refreshExclusive(runJwtCallback),
    ]).then(() => {
      // Both tabs asked, and both were served, but only one refresh token was
      // spent. Without this, the second exchange is a reuse of a spent token
      // and Keycloak revokes the chain.
      expect(keycloak.revoked).toBe(false);
      expect(keycloak.exchanges).toBe(1);
      expect(keycloak.calls).toBe(2);
      expect(keycloak.peakConcurrency).toBe(1);
    });
  });

  test('four tabs still exchange the token once', async () => {
    installFakeLockManager();
    const tabs = Array.from({ length: 4 }, () =>
      createSessionRefreshCoordinator()
    );

    await Promise.all(tabs.map((tab) => tab.refreshExclusive(runJwtCallback)));

    expect(keycloak.revoked).toBe(false);
    expect(keycloak.exchanges).toBe(1);
    expect(keycloak.calls).toBe(4);
    expect(keycloak.peakConcurrency).toBe(1);
  });

  test('the timer path and the API path in two tabs do not overlap', async () => {
    installFakeLockManager();
    const tabA = createSessionRefreshCoordinator();
    const tabB = createSessionRefreshCoordinator();

    // The provider's timer in one tab, the API client's recovery in the other.
    await Promise.all([
      tabA.refreshExclusive(runJwtCallback),
      tabB.refreshOnce(runJwtCallback),
    ]);

    expect(keycloak.revoked).toBe(false);
    expect(keycloak.exchanges).toBe(1);
    expect(keycloak.peakConcurrency).toBe(1);
  });
});

describe('within one tab', () => {
  test('refreshOnce collapses concurrent callers into a single round trip', async () => {
    installFakeLockManager();
    const tab = createSessionRefreshCoordinator();

    await Promise.all([
      tab.refreshOnce(runJwtCallback),
      tab.refreshOnce(runJwtCallback),
      tab.refreshOnce(runJwtCallback),
      tab.refreshOnce(runJwtCallback),
    ]);

    expect(keycloak.calls).toBe(1);
    expect(keycloak.exchanges).toBe(1);
  });

  test('a later expiry refreshes again once the first has settled', async () => {
    installFakeLockManager();
    const tab = createSessionRefreshCoordinator();

    await tab.refreshOnce(runJwtCallback);
    // The token lapses again later on.
    keycloak.expiresAt = TOKEN_REFRESH.REFRESH_BUFFER_MS;
    await tab.refreshOnce(runJwtCallback);

    expect(keycloak.calls).toBe(2);
    expect(keycloak.exchanges).toBe(2);
  });

  test('the timer path and the API path do not overlap', async () => {
    installFakeLockManager();
    const tab = createSessionRefreshCoordinator();

    await Promise.all([
      tab.refreshExclusive(runJwtCallback),
      tab.refreshOnce(runJwtCallback),
    ]);

    expect(keycloak.peakConcurrency).toBe(1);
    expect(keycloak.exchanges).toBe(1);
  });
});

describe('without the Web Locks API', () => {
  test('refreshes are still serialised inside the tab', async () => {
    removeLockManager();
    const tab = createSessionRefreshCoordinator();

    await Promise.all([
      tab.refreshExclusive(runJwtCallback),
      tab.refreshExclusive(runJwtCallback),
      tab.refreshExclusive(runJwtCallback),
    ]);

    // Queued rather than parallel, so one exchange even with no lock manager.
    expect(keycloak.revoked).toBe(false);
    expect(keycloak.exchanges).toBe(1);
    expect(keycloak.calls).toBe(3);
    expect(keycloak.peakConcurrency).toBe(1);
  });

  test('refreshOnce still collapses concurrent callers', async () => {
    removeLockManager();
    const tab = createSessionRefreshCoordinator();

    await Promise.all([
      tab.refreshOnce(runJwtCallback),
      tab.refreshOnce(runJwtCallback),
    ]);

    expect(keycloak.calls).toBe(1);
    expect(keycloak.exchanges).toBe(1);
  });

  test('it degrades rather than throwing, and cannot reach across tabs', async () => {
    removeLockManager();
    const tabA = createSessionRefreshCoordinator();
    const tabB = createSessionRefreshCoordinator();

    await Promise.all([
      tabA.refreshExclusive(runJwtCallback),
      tabB.refreshExclusive(runJwtCallback),
    ]);

    // The documented limit of the fallback: a per-tab queue cannot see another
    // tab, so both tabs post the same refresh token and the loser's post is a
    // reuse. This is the pre-lock behaviour rather than an error, and it is
    // exactly what the lock above exists to prevent.
    expect(keycloak.calls).toBe(2);
    expect(keycloak.exchanges).toBe(1);
    expect(keycloak.revoked).toBe(true);
  });
});

describe('failures', () => {
  test('a rejected refresh reaches the caller and frees the lock', async () => {
    installFakeLockManager();
    const tab = createSessionRefreshCoordinator();

    await expect(tab.refreshExclusive(failingRefresh)).rejects.toThrow(
      'refresh failed'
    );

    // The next refresh still runs, so one failure does not wedge the queue.
    await tab.refreshExclusive(runJwtCallback);
    expect(keycloak.exchanges).toBe(1);
  });

  test('a rejected refresh clears the shared in-flight promise', async () => {
    removeLockManager();
    const tab = createSessionRefreshCoordinator();

    await expect(tab.refreshOnce(failingRefresh)).rejects.toThrow(
      'refresh failed'
    );

    await tab.refreshOnce(runJwtCallback);
    expect(keycloak.calls).toBe(1);
    expect(keycloak.exchanges).toBe(1);
  });
});
