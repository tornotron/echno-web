import { describe, expect, test } from 'bun:test';

import { isLocationSettled, nextLocationStep } from './mark-attendance-dialog';

describe('nextLocationStep', () => {
  test('reports an environment blocker whatever the permission says', () => {
    expect(nextLocationStep('unsupported', 'granted', true)).toEqual({
      status: 'error',
      kind: 'unsupported',
    });
    expect(nextLocationStep('insecure', 'prompt', false)).toEqual({
      status: 'error',
      kind: 'insecure',
    });
  });

  test('reports a denied permission instead of re-requesting it', () => {
    // A click must not fall through to getCurrentPosition here: the browser
    // will not re-prompt, so the request would fail the same way and the
    // employee would be told nothing new.
    expect(nextLocationStep(null, 'denied', true)).toEqual({
      status: 'error',
      kind: 'permission-denied',
    });
    expect(nextLocationStep(null, 'denied', false)).toEqual({
      status: 'error',
      kind: 'permission-denied',
    });
  });

  test('explains an unresolved permission before the prompt is raised', () => {
    expect(nextLocationStep(null, 'prompt', false)).toEqual({
      status: 'error',
      kind: 'permission-required',
    });
  });

  test('raises the prompt once the employee asks for it', () => {
    expect(nextLocationStep(null, 'prompt', true)).toEqual({
      status: 'detecting',
    });
  });

  test('goes straight to the position request when already granted', () => {
    expect(nextLocationStep(null, 'granted', false)).toEqual({
      status: 'detecting',
    });
    expect(nextLocationStep(null, 'granted', true)).toEqual({
      status: 'detecting',
    });
  });

  test('falls back to asking when the permission cannot be read', () => {
    // Older Safari and some in-app webviews have no Permissions API. There the
    // only way to learn the state is to ask for a position and read the error
    // code, so the automatic pass must not stall on an explanation.
    expect(nextLocationStep(null, null, false)).toEqual({
      status: 'detecting',
    });
  });
});

describe('isLocationSettled', () => {
  test('waits while the attempt is still in flight, either way', () => {
    for (const required of [true, false]) {
      expect(isLocationSettled('idle', required)).toBe(false);
      expect(isLocationSettled('detecting', required)).toBe(false);
    }
  });

  test('a detected position settles both kinds of profile', () => {
    expect(isLocationSettled('detected', true)).toBe(true);
    expect(isLocationSettled('detected', false)).toBe(true);
  });

  test('a failure is fatal only where the profile asked for a location', () => {
    // The regression this pins: an employee on a profile with
    // geolocationRequired off could not clock in when the browser refused a
    // position, because the dialog waited for coordinates nothing needed.
    expect(isLocationSettled('error', false)).toBe(true);
    expect(isLocationSettled('error', true)).toBe(false);
  });
});
