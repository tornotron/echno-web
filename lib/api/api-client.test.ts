import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import * as realAuth from 'next-auth/react';
import { SESSION_TOKEN_EXPIRED_ERROR } from '@/lib/auth/constants';

// Counts the forced session round trips. Spread the real module so the rest of
// next-auth/react keeps working for anything else that imports it.
let getSessionCalls = 0;
mock.module('next-auth/react', () => ({
  ...realAuth,
  getSession: async () => {
    getSessionCalls++;
    return null;
  },
}));

// The client resolves relative endpoints against the page origin, which the
// preloaded DOM leaves on about:blank until it is given a real URL.
(
  globalThis as unknown as { happyDOM: { setURL: (url: string) => void } }
).happyDOM.setURL('http://localhost:3000/');

// Reach for the client instance rather than the bound `api` helpers: a sibling
// suite swaps those helpers for spies through the shared module registry, while
// the instance itself passes through untouched.
const { apiClient, ApiError } = await import('./api-client');

// Responses the stubbed fetch hands back, in order, plus the URLs it was called
// with so a replay can be told apart from a single call.
let queuedResponses: Response[] = [];
let fetchCalls: string[] = [];
const realFetch = globalThis.fetch;

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

beforeEach(() => {
  getSessionCalls = 0;
  fetchCalls = [];
  queuedResponses = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    fetchCalls.push(String(input));
    const next = queuedResponses.shift();
    if (!next) {
      throw new Error('fetch called more times than the test queued');
    }
    return next;
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('expired access token recovery', () => {
  test('refreshes the session and replays the request once', async () => {
    queuedResponses = [
      jsonResponse({ error: SESSION_TOKEN_EXPIRED_ERROR }, 401),
      jsonResponse({ id: 7 }, 200),
    ];

    const result = await apiClient.get<{ id: number }>('/v1/employees');

    expect(result).toEqual({ id: 7 });
    expect(getSessionCalls).toBe(1);
    expect(fetchCalls).toHaveLength(2);
  });

  test('replays a POST with its body intact', async () => {
    queuedResponses = [
      jsonResponse({ error: SESSION_TOKEN_EXPIRED_ERROR }, 401),
      jsonResponse({ ok: true }, 200),
    ];

    const result = await apiClient.post<{ ok: boolean }>('/v1/leave-requests', {
      days: 2,
    });

    expect(result).toEqual({ ok: true });
    expect(getSessionCalls).toBe(1);
    expect(fetchCalls).toHaveLength(2);
  });

  test('gives up after one replay when the token is still expired', async () => {
    queuedResponses = [
      jsonResponse({ error: SESSION_TOKEN_EXPIRED_ERROR }, 401),
      jsonResponse({ error: SESSION_TOKEN_EXPIRED_ERROR }, 401),
    ];

    const error = (await apiClient
      .get('/v1/employees')
      .catch((error_: unknown) => error_)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(getSessionCalls).toBe(1);
    expect(fetchCalls).toHaveLength(2);
  });

  test('leaves the body readable for the error path', async () => {
    // The signal check clones before reading, so handleResponse must still find
    // the backend's own message on the response it is handed.
    queuedResponses = [
      jsonResponse({ message: 'Employee not found', status: 404 }, 404),
    ];

    const error = (await apiClient
      .get('/v1/employees/99')
      .catch((error_: unknown) => error_)) as ApiError;

    expect(error.message).toBe('Employee not found');
    expect(error.status).toBe(404);
  });
});

describe('responses that must behave exactly as before', () => {
  test('a 401 without the expiry signal is not recovered from', async () => {
    queuedResponses = [jsonResponse({ message: 'Unauthorized' }, 401)];

    const error = (await apiClient
      .get('/v1/employees')
      .catch((error_: unknown) => error_)) as ApiError;

    expect(error.status).toBe(401);
    expect(error.isAuthError).toBe(true);
    expect(getSessionCalls).toBe(0);
    expect(fetchCalls).toHaveLength(1);
  });

  test('a 401 with a non-JSON body is not recovered from', async () => {
    queuedResponses = [
      new Response('gateway said no', {
        status: 401,
        headers: { 'Content-Type': 'text/plain' },
      }),
    ];

    const error = (await apiClient
      .get('/v1/employees')
      .catch((error_: unknown) => error_)) as ApiError;

    expect(error.status).toBe(401);
    expect(getSessionCalls).toBe(0);
    expect(fetchCalls).toHaveLength(1);
  });

  test('a server error passes straight through', async () => {
    queuedResponses = [jsonResponse({ message: 'Boom' }, 500)];

    const error = (await apiClient
      .get('/v1/employees')
      .catch((error_: unknown) => error_)) as ApiError;

    expect(error.status).toBe(500);
    expect(error.isServerError).toBe(true);
    expect(getSessionCalls).toBe(0);
    expect(fetchCalls).toHaveLength(1);
  });

  test('a successful response never touches the session', async () => {
    queuedResponses = [jsonResponse({ items: [] }, 200)];

    await apiClient.get('/v1/employees');

    expect(getSessionCalls).toBe(0);
    expect(fetchCalls).toHaveLength(1);
  });
});
