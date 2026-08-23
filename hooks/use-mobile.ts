import * as React from 'react';

const MOBILE_BREAKPOINT = 1024;

/**
 * Reports whether the viewport is below the mobile breakpoint (1024px), so
 * components can branch between mobile and desktop layouts. Tracks viewport
 * changes with a matchMedia listener and returns false during the first render
 * on the server, settling to the real value once mounted on the client.
 *
 * @returns True when the viewport width is under 1024px.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
