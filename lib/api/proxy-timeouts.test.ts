import { describe, expect, test } from 'bun:test';
import {
  REQUEST_TIMEOUT_MS,
  UPLOAD_TIMEOUT_MS,
  proxyTimeoutMs,
} from './proxy-timeouts';

const COMPLIANCE_JOBS_PATH = 'inspections/web/compliance/jobs';

describe('proxyTimeoutMs', () => {
  test('an ordinary request gets the default budget', () => {
    expect(proxyTimeoutMs('user/web', false)).toBe(REQUEST_TIMEOUT_MS);
  });

  test('an upload gets the upload budget', () => {
    expect(proxyTimeoutMs('attachments/web', true)).toBe(UPLOAD_TIMEOUT_MS);
  });

  // Compliance generation used to be the one endpoint here, on a 55-second
  // budget, because it ran an external AI model inside the request. It is a
  // queued job now: starting one is an insert and polling one is a single-row
  // read, so neither needs more than the default, and an endpoint quietly
  // getting a raised budget again would mean something slow had crept back
  // onto the request thread.
  test('the compliance job endpoints need no more than the default', () => {
    expect(proxyTimeoutMs(COMPLIANCE_JOBS_PATH, false)).toBe(REQUEST_TIMEOUT_MS);
    expect(
      proxyTimeoutMs(`${COMPLIANCE_JOBS_PATH}/ac9c2f6e-0f9a-4a0e-9c2b-1a1d7e0b4c11`, false)
    ).toBe(REQUEST_TIMEOUT_MS);
  });

  test('and the synchronous endpoint it replaced no longer has a budget of its own', () => {
    expect(
      proxyTimeoutMs('inspections/web/compliance/regenerate', false)
    ).toBe(REQUEST_TIMEOUT_MS);
  });

  // The lookup must not be fooled by a path that names an inherited property,
  // which is why it is a Map: a number is the only thing that may come back.
  test('a path naming an inherited property gets the default', () => {
    for (const path of ['constructor', '__proto__', 'toString', 'valueOf']) {
      expect(proxyTimeoutMs(path, false)).toBe(REQUEST_TIMEOUT_MS);
    }
  });
});
