import { describe, expect, test } from 'bun:test';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from './use-debounce';

// First hook test on the happy-dom + testing-library setup. Uses real timers with
// a short delay and waitFor, which is deterministic without fake-timer support.
describe('useDebounce', () => {
  test('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('a', 20));
    expect(result.current).toBe('a');
  });

  test('settles on the new value only after the delay', async () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 20), {
      initialProps: { v: 'a' },
    });

    rerender({ v: 'b' });
    // Still the old value on the same tick.
    expect(result.current).toBe('a');

    await waitFor(() => expect(result.current).toBe('b'));
  });

  test('only the last value settles when changes come faster than the delay', async () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 30), {
      initialProps: { v: 'a' },
    });

    rerender({ v: 'b' });
    rerender({ v: 'c' });

    await waitFor(() => expect(result.current).toBe('c'));
    expect(result.current).toBe('c');
  });
});
