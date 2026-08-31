import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import * as realAuth from 'next-auth/react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import { SESSION_TOKEN_EXPIRED_ERROR } from '@/lib/auth/constants';

// Counts the forced session round trips. Spread the real module so the rest of
// next-auth/react keeps working for anything else that imports it. The refresh
// is deliberately not instant, so a concurrency test can pile callers onto the
// one in flight the way parallel dashboard queries do.
let getSessionCalls = 0;
const GET_SESSION_DELAY_MS = 20;
mock.module('next-auth/react', () => ({
  ...realAuth,
  getSession: async () => {
    getSessionCalls++;
    await new Promise((resolve) => setTimeout(resolve, GET_SESSION_DELAY_MS));
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
// Set by tests whose requests overlap, where a fixed queue order says nothing.
// Receives the 1-based call number and returns the response for it.
let respondByCallNumber: ((call: number) => Response) | null = null;
const realFetch = globalThis.fetch;

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, { status });
}

beforeEach(() => {
  getSessionCalls = 0;
  fetchCalls = [];
  queuedResponses = [];
  respondByCallNumber = null;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    fetchCalls.push(String(input));
    if (respondByCallNumber) {
      return respondByCallNumber(fetchCalls.length);
    }
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

  test('shares one refresh across requests that expire together', async () => {
    // The dashboard fires its queries in parallel, so they all hit the expiry
    // signal in the same instant. One refresh token is single-use on our
    // realms, so a refresh each would revoke the chain and log the user out.
    const CONCURRENT = 4;
    respondByCallNumber = (call) =>
      call <= CONCURRENT
        ? jsonResponse({ error: SESSION_TOKEN_EXPIRED_ERROR }, 401)
        : jsonResponse({ call }, 200);

    const results = await Promise.all([
      apiClient.get('/v1/chat/messages'),
      apiClient.get('/v1/employees'),
      apiClient.get('/v1/users/me'),
      apiClient.get('/v1/leave-requests'),
    ]);

    expect(getSessionCalls).toBe(1);
    // Every request replayed itself once off that single shared refresh.
    expect(fetchCalls).toHaveLength(CONCURRENT * 2);
    expect(results).toHaveLength(CONCURRENT);
    for (const result of results) {
      expect(result).toBeDefined();
    }
  });

  test('refreshes again for an expiry after the first refresh settled', async () => {
    // The single-flight promise is cleared once it settles, so a token that
    // lapses later still gets its own refresh.
    respondByCallNumber = (call) =>
      call === 1 || call === 2 || call === 5 || call === 6
        ? jsonResponse({ error: SESSION_TOKEN_EXPIRED_ERROR }, 401)
        : jsonResponse({ call }, 200);

    await Promise.all([
      apiClient.get('/v1/employees'),
      apiClient.get('/v1/users/me'),
    ]);
    expect(getSessionCalls).toBe(1);

    await Promise.all([
      apiClient.get('/v1/employees'),
      apiClient.get('/v1/users/me'),
    ]);
    expect(getSessionCalls).toBe(2);
    expect(fetchCalls).toHaveLength(8);
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

// The app kept its own `ApiError` and its own `getErrorTitle` /
// `getErrorMessage` beside the package's. Both pairs compiled, so nothing
// complained, and the two never met: a failure raised by this client was not an
// `instanceof` the class the package's helpers narrow on, so `getErrorTitle`
// fell through to whatever default the call site passed and `getErrorMessage`
// read the failure as a plain `Error`.
//
// These import the class from this module and the helpers from the package,
// which is the pairing the app now runs. Every one of them fails against a
// locally declared class, because the helpers stop recognising it.
describe('the failures this client raises are the ones the package reads', () => {
  test('a failure from this client is an instance of the class the package exports', async () => {
    queuedResponses = [
      jsonResponse(
        {
          title: 'Access Denied',
          message: 'Access is denied: requires role hr-admin',
          details: 'uri=/api/v1/leave-requests/web/9/approve',
        },
        403
      ),
    ];

    const error = await apiClient
      .get('/v1/leave-requests/9/approve')
      .catch((error_: unknown) => error_);

    expect(error instanceof ApiError).toBe(true);
    expect(getErrorTitle(error, 'Operation Failed')).not.toBe(
      'Operation Failed'
    );
  });

  test('a 403 is headed by the problem the server named, not by a login prompt', async () => {
    queuedResponses = [
      jsonResponse(
        {
          title: 'Access Denied',
          message: 'Access is denied: requires role hr-admin',
          details: 'uri=/api/v1/leave-requests/web/9/approve',
        },
        403
      ),
    ];

    const error = await apiClient
      .get('/v1/leave-requests/9/approve')
      .catch((error_: unknown) => error_);

    expect(getErrorTitle(error, 'Could not approve the request')).toBe(
      'Access Denied'
    );
  });

  test('a 403 with no title of its own still avoids telling a signed-in user to sign in', async () => {
    queuedResponses = [
      jsonResponse({ message: 'Access is denied' }, 403),
    ];

    const error = await apiClient
      .get('/v1/leave-requests/9/approve')
      .catch((error_: unknown) => error_);

    expect(getErrorTitle(error, 'Could not approve the request')).toBe(
      'Not Permitted'
    );
  });

  test('a 401 is the one status that does mean sign in again', async () => {
    queuedResponses = [jsonResponse({ message: 'Please sign in.' }, 401)];

    const error = await apiClient
      .get('/v1/leave-requests/9/approve')
      .catch((error_: unknown) => error_);

    expect(getErrorTitle(error, 'Could not approve the request')).toBe(
      'Authentication Required'
    );
  });

  test('the description is the sentence the backend wrote, never the request URI', async () => {
    queuedResponses = [
      jsonResponse(
        {
          title: 'Validation Failed',
          message: 'The leave request has already been approved.',
          details: 'uri=/api/v1/leave-requests/web/9/approve',
        },
        400
      ),
    ];

    const error = await apiClient
      .get('/v1/leave-requests/9/approve')
      .catch((error_: unknown) => error_);

    expect(getErrorMessage(error)).toBe(
      'The leave request has already been approved.'
    );
    expect(getErrorMessage(error)).not.toContain('uri=');
  });

  test('a details field that is not a string never reaches a consumer typed for one', async () => {
    // The subscription endpoints fill `details` with a quota breakdown rather
    // than a request description, and `ApiError.details` is typed as a string.
    queuedResponses = [
      jsonResponse(
        {
          title: 'Quota Exceeded',
          message: 'The plan does not cover another project.',
          details: { limit: 3, used: 3 },
        },
        402
      ),
    ];

    const error = (await apiClient
      .get('/v1/projects')
      .catch((error_: unknown) => error_)) as ApiError;

    expect(error.details).toBeUndefined();
    expect(getErrorMessage(error)).toBe(
      'The plan does not cover another project.'
    );
  });

  test('field-level validation messages are still appended to the sentence', async () => {
    queuedResponses = [
      jsonResponse(
        {
          title: 'Validation Failed',
          message: 'The request could not be saved.',
          details: 'uri=/api/v1/leave-requests/web',
          errors: { endDate: ['must not be before the start date'] },
        },
        400
      ),
    ];

    const error = await apiClient
      .post('/v1/leave-requests', {})
      .catch((error_: unknown) => error_);

    expect(getErrorMessage(error)).toContain('The request could not be saved.');
    expect(getErrorMessage(error)).toContain(
      'endDate: must not be before the start date'
    );
  });
});
