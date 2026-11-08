import { afterEach, describe, expect, test } from 'bun:test';

import { validateAuthConfig } from '@/config/auth-config';

/** `validateAuthConfig` checks the variables of the provider in use, and only those. */

const NAMES = [
  'AUTH_PROVIDER',
  'KEYCLOAK_ISSUER',
  'KEYCLOAK_ID',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'WORKOS_API_KEY',
  'WORKOS_CLIENT_ID',
  'WORKOS_COOKIE_PASSWORD',
  'NEXT_PUBLIC_WORKOS_REDIRECT_URI',
  'WORKOS_ISSUER',
  'ECHNO_SESSION_ACTIVITY_SECRET',
] as const;

const saved = Object.fromEntries(
  NAMES.map((name) => [name, process.env[name]])
);

function setEnvironment(
  values: Partial<Record<(typeof NAMES)[number], string>>
) {
  for (const name of NAMES) delete process.env[name];
  Object.assign(process.env, values);
}

afterEach(() => {
  for (const name of NAMES) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
});

const KEYCLOAK = {
  KEYCLOAK_ISSUER: 'https://auth.example.test/realms/echno-realm',
  KEYCLOAK_ID: 'echno-web-client',
  NEXTAUTH_SECRET: 'x'.repeat(40),
  NEXTAUTH_URL: 'https://app.example.test',
};

const WORKOS = {
  AUTH_PROVIDER: 'workos',
  WORKOS_API_KEY: 'sk_test_not_a_real_key',
  WORKOS_CLIENT_ID: 'client_test',
  WORKOS_COOKIE_PASSWORD: 'p'.repeat(32),
  NEXT_PUBLIC_WORKOS_REDIRECT_URI: 'https://app.example.test/callback',
  WORKOS_ISSUER: 'https://api.workos.com/user_management/client_test',
  ECHNO_SESSION_ACTIVITY_SECRET: 's'.repeat(32),
};

describe('under Keycloak', () => {
  test('passes with the Keycloak variables and no WorkOS ones', () => {
    setEnvironment(KEYCLOAK);
    expect(() => validateAuthConfig()).not.toThrow();
  });

  test('names a missing Keycloak variable', () => {
    setEnvironment({ ...KEYCLOAK, KEYCLOAK_ID: '' });
    expect(() => validateAuthConfig()).toThrow('KEYCLOAK_ID');
  });
});

describe('under WorkOS', () => {
  test('passes with the WorkOS variables and no Keycloak ones', () => {
    setEnvironment(WORKOS);
    expect(() => validateAuthConfig()).not.toThrow();
  });

  test('names every missing variable at once', () => {
    setEnvironment({
      AUTH_PROVIDER: 'workos',
      WORKOS_CLIENT_ID: 'client_test',
    });
    let message = '';
    try {
      validateAuthConfig();
    } catch (error) {
      message = (error as Error).message;
    }
    for (const name of [
      'WORKOS_API_KEY',
      'WORKOS_COOKIE_PASSWORD',
      'NEXT_PUBLIC_WORKOS_REDIRECT_URI',
      'WORKOS_ISSUER',
      'ECHNO_SESSION_ACTIVITY_SECRET',
    ]) {
      expect(message).toContain(name);
    }
    expect(message).not.toContain('KEYCLOAK');
  });

  test('refuses a redirect URI that is not a URL', () => {
    setEnvironment({ ...WORKOS, NEXT_PUBLIC_WORKOS_REDIRECT_URI: '/callback' });
    expect(() => validateAuthConfig()).toThrow(
      'NEXT_PUBLIC_WORKOS_REDIRECT_URI'
    );
  });

  test('refuses short secrets', () => {
    setEnvironment({ ...WORKOS, WORKOS_COOKIE_PASSWORD: 'short' });
    expect(() => validateAuthConfig()).toThrow('WORKOS_COOKIE_PASSWORD');
    setEnvironment({ ...WORKOS, ECHNO_SESSION_ACTIVITY_SECRET: 'short' });
    expect(() => validateAuthConfig()).toThrow('ECHNO_SESSION_ACTIVITY_SECRET');
  });

  test('an unknown AUTH_PROVIDER is refused', () => {
    setEnvironment({ ...WORKOS, AUTH_PROVIDER: 'okta' });
    expect(() => validateAuthConfig()).toThrow('AUTH_PROVIDER');
  });
});
