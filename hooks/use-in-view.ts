'use client';

import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  /** Once true, never goes back to false (fire-once). Default: true */
  once?: boolean;
}

/**
 * Tracks whether an element has scrolled into the viewport, using an
 * IntersectionObserver. Attach the returned `ref` to the element you want to
 * watch and read `isInView` to drive scroll-triggered animations or lazy
 * content. By default it fires once (`once: true`) and disconnects the observer
 * the first time the element becomes visible; set `once: false` to keep
 * tracking so `isInView` toggles back to false when the element leaves view.
 *
 * @param options - Observer tuning: `threshold` (fraction of the element that
 *   must be visible, default 0.15), `rootMargin` (default '0px'), and `once`.
 * @returns `ref` to place on the target element and `isInView`, true once the
 *   visibility condition is met.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
) {
  const { threshold = 0.15, rootMargin = '0px', once = true } = options;
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, isInView };
}
