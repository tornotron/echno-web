'use client';

import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delay`
 * milliseconds have passed without a change. Useful for search inputs that
 * drive a server request, so a request fires once the user pauses rather than
 * on every keystroke.
 *
 * @param value - The value to debounce.
 * @param delay - Idle time in milliseconds before the value settles (default 300).
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
