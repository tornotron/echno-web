'use client';

import { signOut } from '@/lib/auth/client';
import { logger } from '@/lib/logger';
import { clearAllFormDrafts } from '@/lib/forms/form-draft-storage';

/**
 * Simple sign out (NextAuth + Keycloak, or WorkOS)
 *
 * Keycloak logout is handled server-side in lib/auth/keycloak/auth.ts events.signOut callback
 * This keeps the client-side simple and avoids race conditions. Under WorkOS the
 * same call goes through `/sign-out` and WorkOS's hosted logout.
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
    // The events.signOut callback in lib/auth/keycloak/auth.ts will handle Keycloak logout
    await signOut({ callbackUrl: '/?logout=success' });
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
    await signOut({ redirect: false });
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
    await signOut({ redirect: false });

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
