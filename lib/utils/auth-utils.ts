'use client';

import { signOut as nextAuthSignOut } from 'next-auth/react';
import { Session } from 'next-auth';

import { clearAllNextAuthCookies } from '../auth/cookie-cleanup';

/**
 * Enhanced sign out with Keycloak logout support
 *
 * This ensures:
 * 1. Local NextAuth session is cleared
 * 2. Keycloak SSO session is terminated (handled server-side)
 * 3. User is logged out from all connected applications (via backchannel)
 * 4. All cookies are properly cleaned up
 * 5. Secure redirect back to login page
 *
 * Note: Keycloak logout is handled server-side in auth.ts events.signOut
 * This avoids exposing tokens in the client session (reduces cookie size)
 */
export async function handleSignOut(session: Session | null) {
  try {
    // Clear local storage
    localStorage.removeItem('loginToastShown');

    // Clear all NextAuth cookies immediately
    clearAllNextAuthCookies();

    // Sign out from NextAuth (server will handle Keycloak logout)
    // The events.signOut callback in auth.ts will:
    // 1. Terminate Keycloak SSO session if provider is Keycloak
    // 2. Clear refresh tokens
    // 3. Trigger backchannel logout to other apps
    await nextAuthSignOut({ callbackUrl: '/login?logout=success' });
  } catch (error) {
    console.error('[Logout] Error during sign out:', error);

    // Fallback: force redirect to login
    globalThis.location.href = '/login?error=logout_failed';
  }
}

/**
 * Silent logout (no redirect, just clear session)
 * Useful for session expiration or background logout
 */
export async function silentLogout() {
  try {
    localStorage.removeItem('loginToastShown');
    await nextAuthSignOut({ redirect: false });
  } catch (error) {
    console.error('[Logout] Silent logout failed:', error);
  }
}

/**
 * Force logout with immediate redirect
 * Use when session is invalid or compromised
 */
export async function forceLogout(reason = 'session_invalid') {
  try {
    // Clear all cookies
    clearAllNextAuthCookies();

    // Clear all local storage
    localStorage.clear();

    // Sign out from NextAuth
    await nextAuthSignOut({ redirect: false });

    // Small delay to ensure cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Redirect
    globalThis.location.href = `/login?error=${reason}`;
  } catch (error) {
    console.error('[Logout] Force logout failed:', error);
    // Fallback: force redirect
    clearAllNextAuthCookies();
    globalThis.location.href = '/login';
  }
}
