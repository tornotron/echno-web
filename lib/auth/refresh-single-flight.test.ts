import { beforeEach, describe, expect, test } from 'bun:test';
import {
  RESULT_CACHE_MAX_ENTRIES,
  RESULT_CACHE_TTL_MS,
  createRefreshSingleFlight,
} from './refresh-single-flight';

/**
 * Stands in for a Keycloak realm running `revokeRefreshToken` with
 * `refreshTokenMaxReuse` at 0.
 *
 * `accepted` is the serial of the only refresh token the realm will still take.
 * Posting anything older is a replay, which revokes the chain: that is the
 * "Maximum allowed refresh token reuse exceeded" the incident logged, and the
 * reason the session died rather than merely failing to refresh.
 */
const keycloak = {
  accepted: 'refresh-1',
  exchanges: 0,
  revoked: false,
};

interface ExchangedToken {
  accessToken: string;
  refreshToken: string;
}

/** One round trip to the token endpoint. */
async function exchange(presented: string): Promise<ExchangedToken> {
  // Let anything else that is ready run, the way a network round trip would.
  await new Promise((resolve) => setTimeout(resolve, 5));

  if (presented !== keycloak.accepted) {
    keycloak.revoked = true;
    throw new Error('Maximum allowed refresh token reuse exceeded');
  }

  keycloak.exchanges++;
  const serial = keycloak.exchanges + 1;
  keycloak.accepted = `refresh-${serial}`;
  return {
    accessToken: `access-${serial}`,
    refreshToken: keycloak.accepted,
  };
}

beforeEach(() => {
  keycloak.accepted = 'refresh-1';
  keycloak.exchanges = 0;
  keycloak.revoked = false;
});

describe('refresh single flight', () => {
  test('an unguarded double exchange is what revokes the chain', async () => {
    // The control case, and the shape of the 14:06:15 incident: two refreshes
    // started in the same instant, both holding the cookie's refresh token.
    const results = await Promise.allSettled([
      exchange('refresh-1'),
      exchange('refresh-1'),
    ]);

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
    expect(keycloak.revoked).toBe(true);
  });

  test('concurrent callers holding the same token exchange once', async () => {
    const singleFlight = createRefreshSingleFlight<ExchangedToken>();

    const [first, second] = await Promise.all([
      singleFlight.run('refresh-1', () => exchange('refresh-1')),
      singleFlight.run('refresh-1', () => exchange('refresh-1')),
    ]);

    expect(keycloak.exchanges).toBe(1);
    expect(keycloak.revoked).toBe(false);
    expect(first).toEqual(second);
    expect(first.refreshToken).toBe('refresh-2');
  });

  test('a caller that read the cookie before the winner rewrote it is served the result', async () => {
    const singleFlight = createRefreshSingleFlight<ExchangedToken>();

    // The winner completes and the cookie now holds refresh-2.
    const winner = await singleFlight.run('refresh-1', () =>
      exchange('refresh-1')
    );

    // A request already in flight still carries the copy it read beforehand.
    // Left to itself it would post a spent token and revoke the chain.
    const straggler = await singleFlight.run('refresh-1', () =>
      exchange('refresh-1')
    );

    expect(keycloak.exchanges).toBe(1);
    expect(keycloak.revoked).toBe(false);
    expect(straggler).toEqual(winner);
  });

  test('a genuinely later exchange is not served the cached result', async () => {
    const singleFlight = createRefreshSingleFlight<ExchangedToken>();

    await singleFlight.run('refresh-1', () => exchange('refresh-1'));
    const next = await singleFlight.run('refresh-2', () =>
      exchange('refresh-2')
    );

    expect(keycloak.exchanges).toBe(2);
    expect(next.refreshToken).toBe('refresh-3');
  });

  test('the cached result stops being served once its time is up', async () => {
    let clock = 1000;
    const singleFlight = createRefreshSingleFlight<ExchangedToken>(() => clock);

    await singleFlight.run('refresh-1', () => exchange('refresh-1'));
    clock += RESULT_CACHE_TTL_MS + 1;

    // Past the window the token really is spent, so the caller gets the honest
    // rejection rather than a stale success.
    await expect(
      singleFlight.run('refresh-1', () => exchange('refresh-1'))
    ).rejects.toThrow('reuse exceeded');
  });

  test('a failed exchange is not cached, so the next attempt can retry', async () => {
    const singleFlight = createRefreshSingleFlight<string>();
    let attempts = 0;

    const flaky = async () => {
      attempts++;
      if (attempts === 1) throw new Error('network reset');
      return 'recovered';
    };

    await expect(singleFlight.run('key', flaky)).rejects.toThrow(
      'network reset'
    );
    expect(await singleFlight.run('key', flaky)).toBe('recovered');
    expect(attempts).toBe(2);
  });

  test('the result cache stays bounded', async () => {
    const clock = 1000;
    const singleFlight = createRefreshSingleFlight<string>(() => clock);

    for (let index = 0; index < RESULT_CACHE_MAX_ENTRIES + 50; index++) {
      // Hold the clock still so nothing expires and only the cap can bound it.
      await singleFlight.run(`key-${index}`, async () => `value-${index}`);
    }

    // The oldest entries are gone, so their keys exchange again rather than
    // being served from a cache that grew without limit.
    let reExchanged = false;
    await singleFlight.run('key-0', async () => {
      reExchanged = true;
      return 'value-0';
    });

    expect(reExchanged).toBe(true);
  });
});
