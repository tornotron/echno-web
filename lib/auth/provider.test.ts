import { afterEach, describe, expect, test } from 'bun:test';
import { NextRequest } from 'next/server';

import { getAuthProvider, parseAuthProvider } from '@/lib/auth/provider';

/**
 * `AUTH_PROVIDER` and what it switches. Keycloak is the default, so a stack that never sets it
 * keeps working as it did, and the WorkOS routes stay closed on it.
 */

const saved = process.env.AUTH_PROVIDER;

function frontchannelRequest() {
  return new NextRequest('http://localhost:3000/api/auth/frontchannel-logout');
}

afterEach(() => {
  if (saved === undefined) delete process.env.AUTH_PROVIDER;
  else process.env.AUTH_PROVIDER = saved;
});

describe('AUTH_PROVIDER', () => {
  test('unset or empty means keycloak', () => {
    expect(parseAuthProvider(undefined)).toBe('keycloak');
    expect(parseAuthProvider('')).toBe('keycloak');
    expect(parseAuthProvider('  ')).toBe('keycloak');
  });

  test('names either provider', () => {
    expect(parseAuthProvider('keycloak')).toBe('keycloak');
    expect(parseAuthProvider('workos')).toBe('workos');
  });

  test('refuses anything else rather than guessing', () => {
    expect(() => parseAuthProvider('WorkOS')).toThrow('AUTH_PROVIDER');
    expect(() => parseAuthProvider('auth0')).toThrow('AUTH_PROVIDER');
  });

  test('is read when asked, not when the module loaded', () => {
    delete process.env.AUTH_PROVIDER;
    expect(getAuthProvider()).toBe('keycloak');
    process.env.AUTH_PROVIDER = 'workos';
    expect(getAuthProvider()).toBe('workos');
  });
});

describe('under Keycloak', () => {
  test('the WorkOS routes answer 404', async () => {
    delete process.env.AUTH_PROVIDER;
    const {
      workosCallbackRoute,
      workosSessionRoute,
      workosSignInRoute,
      workosSignOutRoute,
    } = await import('@/lib/auth/server');

    const url = 'http://localhost:3000';
    const responses = await Promise.all([
      workosSignInRoute(new NextRequest(`${url}/sign-in`)),
      workosCallbackRoute(new NextRequest(`${url}/callback?code=c&state=s`)),
      workosSignOutRoute(
        new NextRequest(`${url}/sign-out`, { method: 'POST' })
      ),
      workosSessionRoute(new NextRequest(`${url}/api/session`)),
    ]);
    expect(responses.map((response) => response.status)).toEqual([
      404, 404, 404, 404,
    ]);
  });

  test('the frontchannel logout still answers, and under WorkOS it does not', async () => {
    const { GET } = await import('@/app/api/auth/frontchannel-logout/route');

    delete process.env.AUTH_PROVIDER;
    // Missing `iss` and `sid`: the Keycloak handler's own answer.
    const underKeycloak = await GET(frontchannelRequest());
    expect(underKeycloak.status).toBe(400);

    process.env.AUTH_PROVIDER = 'workos';
    const underWorkos = await GET(frontchannelRequest());
    expect(underWorkos.status).toBe(404);
  });
});
