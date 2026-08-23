import { describe, expect, test } from 'bun:test';
import type { KeyboardEvent } from 'react';
import { blockNonNumericKeys } from './number-input-utils';

/** Builds a minimal KeyboardEvent stub that records preventDefault calls. */
function keyEvent(key: string) {
  let prevented = false;
  const event = {
    key,
    preventDefault: () => {
      prevented = true;
    },
  } as unknown as KeyboardEvent<HTMLInputElement>;
  return { event, wasPrevented: () => prevented };
}

describe('blockNonNumericKeys', () => {
  test('prevents the exponent and sign keys', () => {
    for (const key of ['e', 'E', '+', '-']) {
      const { event, wasPrevented } = keyEvent(key);
      blockNonNumericKeys(event);
      expect(wasPrevented()).toBe(true);
    }
  });

  test('allows digit keys', () => {
    for (const key of ['0', '1', '5', '9']) {
      const { event, wasPrevented } = keyEvent(key);
      blockNonNumericKeys(event);
      expect(wasPrevented()).toBe(false);
    }
  });

  test('allows the decimal point so decimals still work', () => {
    const { event, wasPrevented } = keyEvent('.');
    blockNonNumericKeys(event);
    expect(wasPrevented()).toBe(false);
  });

  test('leaves editing and navigation keys untouched', () => {
    for (const key of ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Enter']) {
      const { event, wasPrevented } = keyEvent(key);
      blockNonNumericKeys(event);
      expect(wasPrevented()).toBe(false);
    }
  });
});
