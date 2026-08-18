import { describe, expect, test } from 'bun:test';
import { renderHook, waitFor } from '@testing-library/react';
import { useCountUp } from './use-count-up';

describe('useCountUp', () => {
  test('stays at 0 while inactive', () => {
    const { result } = renderHook(() => useCountUp(50, false, 20));
    expect(result.current).toBe(0);
  });

  test('animates up to the target once active', async () => {
    const { result, rerender } = renderHook(
      ({ active }) => useCountUp(50, active, 20),
      { initialProps: { active: false } },
    );

    expect(result.current).toBe(0);
    rerender({ active: true });

    await waitFor(() => expect(result.current).toBe(50));
  });
});
