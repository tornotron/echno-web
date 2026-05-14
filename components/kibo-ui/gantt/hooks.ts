'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export function useMouse<T extends HTMLElement>(): [
  { x: number; y: number },
  RefObject<T | null>,
] {
  const ref = useRef<T | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const onMove = (e: MouseEvent) => setPosition({ x: e.pageX, y: e.pageY });
    element.addEventListener('mousemove', onMove);
    return () => element.removeEventListener('mousemove', onMove);
  }, []);

  return [position, ref];
}

export function useWindowScroll(): [{ x: number | null; y: number | null }] {
  const [scroll, setScroll] = useState<{ x: number | null; y: number | null }>(
    () => ({
      x: typeof window !== 'undefined' ? window.scrollX : null,
      y: typeof window !== 'undefined' ? window.scrollY : null,
    })
  );

  useEffect(() => {
    const onScroll = () => setScroll({ x: window.scrollX, y: window.scrollY });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return [scroll];
}

export function useThrottle<T>(value: T, limit: number): T {
  const [throttled, setThrottled] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const remaining = limit - (Date.now() - lastRan.current);
    if (remaining <= 0) {
      setThrottled(value);
      lastRan.current = Date.now();
      return;
    }
    const timer = setTimeout(() => {
      setThrottled(value);
      lastRan.current = Date.now();
    }, remaining);
    return () => clearTimeout(timer);
  }, [value, limit]);

  return throttled;
}
