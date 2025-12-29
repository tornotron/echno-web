/**
 * Cookie Cleanup Utilities
 *
 * Provides functions to properly clean up NextAuth cookies
 * to prevent stale session issues
 */

/**
 * List of all NextAuth cookie names
 * Both development and production variants
 */
export const NEXTAUTH_COOKIE_NAMES = [
  // Session tokens
  'next-auth.session-token',
  '__Secure-next-auth.session-token',

  // CSRF tokens
  'next-auth.csrf-token',
  '__Host-next-auth.csrf-token',

  // Callback URLs
  'next-auth.callback-url',
  '__Secure-next-auth.callback-url',

  // State parameter (OAuth)
  'next-auth.state',
  '__Secure-next-auth.state',

  // PKCE verifier
  'next-auth.pkce.code_verifier',
  '__Secure-next-auth.pkce.code_verifier',
] as const;

/**
 * Clear all NextAuth cookies from the browser
 * Use this client-side when you need to force a clean slate
 */
export function clearAllNextAuthCookies(): void {
  if (typeof document === 'undefined') {
    console.warn('[Cookie Cleanup] Cannot clear cookies on server side');
    return;
  }

  const domain = globalThis.location.hostname;
  const paths = ['/', '/api/auth'];

  for (const cookieName of NEXTAUTH_COOKIE_NAMES) {
    // Try different path combinations
    for (const path of paths) {
      // Delete cookie
      // eslint-disable-next-line unicorn/no-document-cookie
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;

      // Also try with domain
      // eslint-disable-next-line unicorn/no-document-cookie
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;

      // Try without domain (for localhost)
      if (domain === 'localhost' || domain === '127.0.0.1') {
        // eslint-disable-next-line unicorn/no-document-cookie
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
      }
    }
  }

  console.log('[Cookie Cleanup] All NextAuth cookies cleared');
}

/**
 * Clear specific cookie
 */
export function clearCookie(name: string): void {
  if (typeof document === 'undefined') return;

  const domain = globalThis.location.hostname;
  const paths = ['/', '/api/auth'];

  for (const path of paths) {
    // eslint-disable-next-line unicorn/no-document-cookie
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
    // eslint-disable-next-line unicorn/no-document-cookie
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
  }
}

/**
 * Check if any NextAuth cookies exist
 * Returns true if stale cookies are found
 */
export function hasStaleNextAuthCookies(): boolean {
  if (typeof document === 'undefined') return false;

  const cookies = document.cookie.split(';').map((c) => c.trim());
  return cookies.some((cookie) =>
    NEXTAUTH_COOKIE_NAMES.some((name) => cookie.startsWith(`${name}=`))
  );
}

/**
 * Force logout with complete cookie cleanup
 * Use this when you need to ensure a completely clean logout
 */
export async function forceLogoutWithCleanup(): Promise<void> {
  try {
    // Clear all cookies first
    clearAllNextAuthCookies();

    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('loginToastShown');
    }

    // Small delay to ensure cookies are cleared
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Redirect to login
    globalThis.location.href = '/login?logout=forced';
  } catch (error) {
    console.error('[Cookie Cleanup] Error during forced logout:', error);
    globalThis.location.href = '/login';
  }
}

/**
 * Diagnostic function to list all current cookies
 * Use this for debugging cookie issues
 */
export function debugCookies(): void {
  if (typeof document === 'undefined') {
    console.log('[Cookie Debug] Running on server, no cookies available');
    return;
  }

  const cookies = document.cookie.split(';').map((c) => c.trim());
  console.log('[Cookie Debug] All cookies:');
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    console.log(
      `  - ${name}: ${value?.slice(0, 50)}${value?.length > 50 ? '...' : ''}`
    );
  }

  console.log('\n[Cookie Debug] NextAuth cookies:');
  const nextAuthCookies = cookies.filter((cookie) =>
    NEXTAUTH_COOKIE_NAMES.some((name) => cookie.startsWith(`${name}=`))
  );

  if (nextAuthCookies.length === 0) {
    console.log('  No NextAuth cookies found');
  } else {
    for (const cookie of nextAuthCookies) {
      const [name, value] = cookie.split('=');
      console.log(
        `  - ${name}: ${value?.slice(0, 50)}${value?.length > 50 ? '...' : ''}`
      );
    }
  }
}
