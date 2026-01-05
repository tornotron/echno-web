'use client';

import { useState, useCallback, useEffect } from 'react';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Hook to manage sidebar state with cookie persistence
 * This keeps cookie logic separate from the shadcn/ui component
 */
export function useSidebarCookie() {
  // Helper function to read sidebar state from cookie
  const getSidebarStateFromCookie = useCallback((): boolean => {
    if (typeof document === 'undefined') return true;

    const cookies = document.cookie.split('; ');
    const sidebarCookie = cookies.find((cookie) =>
      cookie.startsWith(`${SIDEBAR_COOKIE_NAME}=`)
    );
    if (sidebarCookie) {
      const value = sidebarCookie.split('=')[1];
      return value === 'true';
    }
    return true; // Default to open if no cookie exists
  }, []);

  // Initialize state from cookie
  const [open, setOpenState] = useState(() => getSidebarStateFromCookie());

  // Wrapper for setOpen that also updates the cookie
  const setOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setOpenState((prev) => {
        const newValue = typeof value === 'function' ? value(prev) : value;

        // Update cookie
        if (typeof document !== 'undefined') {
          // eslint-disable-next-line unicorn/no-document-cookie
          document.cookie = `${SIDEBAR_COOKIE_NAME}=${newValue}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        }

        return newValue;
      });
    },
    []
  );

  return { open, setOpen };
}
