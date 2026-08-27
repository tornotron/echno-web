'use client';

import { signOut as nextAuthSignOut } from 'next-auth/react';
import { logger } from '@/lib/logger';
import { clearAllFormDrafts } from '@/lib/forms/form-draft-storage';

/**
 * Simple sign out (NextAuth + Keycloak)
 *
 * Keycloak logout is handled server-side in auth.ts events.signOut callback
 * This keeps the client-side simple and avoids race conditions
 */
export async function handleSignOut() {
  try {
    // Clear local storage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('loginToastShown');
      localStorage.removeItem('defaultOrganization');
    }

    // Half-filled forms are kept on this device and hold employee names, wages,
    // vendor terms and site detail. None of that may still be readable by the
    // next person to use a shared site machine.
    clearAllFormDrafts();

    // Sign out from NextAuth
    // The events.signOut callback in auth.ts will handle Keycloak logout
    await nextAuthSignOut({ callbackUrl: '/?logout=success' });
  } catch (error) {
    logger.error('Logout: Error during sign out', error);
    // Fallback: force redirect to home
    if (globalThis.window !== undefined) {
      globalThis.location.href = '/?error=logout_failed';
    }
  }
}

/**
 * Silent logout (no redirect, just clear session)
 * Useful for session expiration or background logout
 */
export async function silentLogout() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('loginToastShown');
      localStorage.removeItem('defaultOrganization');
    }
    clearAllFormDrafts();
    await nextAuthSignOut({ redirect: false });
  } catch (error) {
    logger.error('Logout: Silent logout failed', error);
  }
}

/**
 * Force logout with immediate redirect
 * Use when session is invalid or compromised
 */
export async function forceLogout(reason = 'session_invalid') {
  try {
    // Clear local storage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }

    // Sign out from NextAuth
    await nextAuthSignOut({ redirect: false });

    // Small delay to ensure cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Redirect
    if (globalThis.window !== undefined) {
      globalThis.location.href = `/?error=${reason}`;
    }
  } catch (error) {
    logger.error('Logout: Force logout failed', error);
    // Fallback: force redirect
    if (globalThis.window !== undefined) {
      globalThis.location.href = '/';
    }
  }
}
