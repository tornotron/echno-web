import { describe, expect, test } from 'bun:test';
import {
  REQUEST_TIMEOUT_MS,
  UPLOAD_TIMEOUT_MS,
  proxyTimeoutMs,
} from './proxy-timeouts';

const COMPLIANCE_PATH = 'inspections/web/compliance/regenerate';

describe('proxyTimeoutMs', () => {
  test('an ordinary request gets the default budget', () => {
    expect(proxyTimeoutMs('user/web', false)).toBe(REQUEST_TIMEOUT_MS);
  });

  test('an upload gets the upload budget', () => {
    expect(proxyTimeoutMs('attachments/web', true)).toBe(UPLOAD_TIMEOUT_MS);
  });

  // The bug this guards: compliance generation waits on an external AI model,
  // measured at 34-47 seconds on staging, and the default 30 was aborting work
  // that had in fact succeeded.
  test('compliance generation gets more than the default', () => {
    expect(proxyTimeoutMs(COMPLIANCE_PATH, false)).toBeGreaterThan(
      REQUEST_TIMEOUT_MS
    );
  });

  // Two ceilings. The browser allows this call 50 s and has to be the side that
  // gives up first, so it can explain itself rather than leaving a raw gateway
  // error on screen. The reverse proxy in front of the site abandons an
  // upstream response after 60 s.
  test('and stays between the browser budget and the proxy ceiling', () => {
    const timeout = proxyTimeoutMs(COMPLIANCE_PATH, false);
    expect(timeout).toBeGreaterThan(50_000);
    expect(timeout).toBeLessThan(60_000);
  });

  // The lookup must not be fooled by a path that names an inherited property,
  // which is why it is a Map: a number is the only thing that may come back.
  test('a path naming an inherited property gets the default', () => {
    for (const path of ['constructor', '__proto__', 'toString', 'valueOf']) {
      expect(proxyTimeoutMs(path, false)).toBe(REQUEST_TIMEOUT_MS);
    }
  });
});
