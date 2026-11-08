import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test';

import { SESSION_ACTIVITY_UPDATE } from '@/lib/auth/session-idle';
import {
  refreshWorkosSession,
  resetWorkosSessionForTests,
  signOutWorkos,
  updateWorkosSession,
} from '@/lib/auth/workos/client-session';

/**
 * The browser side of the WorkOS session: which request each call makes. The server side of the
 * same requests is covered by `workos-sign-in.test.ts`.
 */

const realFetch = globalThis.fetch;
const realSubmit = HTMLFormElement.prototype.submit;
let requests: { url: string; method: string; body: string | null }[] = [];
let submitted: HTMLFormElement[] = [];

beforeEach(() => {
  resetWorkosSessionForTests();
  requests = [];
  submitted = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({
      url: String(input),
      method: init?.method ?? 'GET',
      body: typeof init?.body === 'string' ? init.body : null,
    });
    const session =
      init?.method === 'DELETE'
        ? null
        : { user: { id: 'user_1' }, provider: 'workos', expires: '' };
    return Response.json(session);
  }) as typeof fetch;
  HTMLFormElement.prototype.submit = function submit(this: HTMLFormElement) {
    submitted.push(this);
  };
});

afterEach(() => {
  for (const form of submitted) form.remove();
});

afterAll(() => {
  globalThis.fetch = realFetch;
  HTMLFormElement.prototype.submit = realSubmit;
});

describe('update', () => {
  test('with the activity assertion, posts it', async () => {
    await updateWorkosSession(SESSION_ACTIVITY_UPDATE);
    expect(requests).toEqual([
      { url: '/api/session', method: 'POST', body: '{"activity":true}' },
    ]);
  });

  test('with nothing, only reads the session', async () => {
    await updateWorkosSession();
    await refreshWorkosSession();
    expect(requests.map((request) => request.method)).toEqual(['GET', 'GET']);
  });

  test('a failed round trip throws so the lifecycle retries it', async () => {
    globalThis.fetch = (async () =>
      new Response('{}', { status: 502 })) as unknown as typeof fetch;
    expect(updateWorkosSession(SESSION_ACTIVITY_UPDATE)).rejects.toThrow('502');
  });
});

describe('sign-out', () => {
  test('in place, ends the session with a DELETE and no form', async () => {
    await signOutWorkos({ redirect: false });
    expect(requests).toEqual([
      { url: '/api/session', method: 'DELETE', body: null },
    ]);
    expect(submitted).toHaveLength(0);
  });

  test('otherwise posts a form to /sign-out with where to land', async () => {
    await signOutWorkos({ callbackUrl: '/?logout=success' });
    expect(submitted).toHaveLength(1);
    const [form] = submitted;
    expect(form.method.toUpperCase()).toBe('POST');
    expect(form.getAttribute('action')).toBe('/sign-out');
    expect(new FormData(form).get('callbackUrl')).toBe('/?logout=success');
    expect(requests).toHaveLength(0);
  });

  test('redirectTo wins over callbackUrl, and the default is home', async () => {
    await signOutWorkos({ redirectTo: '/about', callbackUrl: '/plans' });
    await signOutWorkos();
    expect(
      submitted.map((form) => new FormData(form).get('callbackUrl'))
    ).toEqual(['/about', '/']);
  });
});
