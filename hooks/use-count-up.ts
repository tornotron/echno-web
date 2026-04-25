'use client';

import { useEffect, useState } from 'react';

/** Animates from 0 → target when `isActive` becomes true. */
export function useCountUp(
  target: number,
  isActive: boolean,
  duration = 2200
): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const startTime = performance.now();
    let raf: number;

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isActive, target, duration]);

  return value;
}
