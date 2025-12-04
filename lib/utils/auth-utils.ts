'use client';

import { signOut as nextAuthSignOut } from 'next-auth/react';
import { Session } from 'next-auth';

export async function handleSignOut(session: Session | null) {
  // Clear the login toast flag
  localStorage.removeItem('loginToastShown');

  // If user is logged in via Keycloak, redirect to Keycloak logout
  if (session?.provider === 'keycloak') {
    const keycloakIssuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;

    if (keycloakIssuer && session?.idToken) {
      const logoutUrl = `${keycloakIssuer}/protocol/openid-connect/logout`;

      // Build logout URL with parameters
      const params = new URLSearchParams({
        id_token_hint: session.idToken,
        post_logout_redirect_uri: `${globalThis.location.origin}/login?logout=success`,
      });

      // Sign out from NextAuth first
      await nextAuthSignOut({ redirect: false });

      // Redirect to Keycloak logout (this will terminate the SSO session)
      globalThis.location.href = `${logoutUrl}?${params.toString()}`;
      return;
    }
  }

  // For credentials login or if Keycloak logout fails, use regular NextAuth signOut
  await nextAuthSignOut({ callbackUrl: '/login?logout=success' });
}
