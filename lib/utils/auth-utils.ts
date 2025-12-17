'use client';
import { signOut as nextAuthSignOut } from 'next-auth/react';
import { Session } from 'next-auth';

export async function handleSignOut(session: Session | null) {
  // Clear local storage
  localStorage.removeItem('loginToastShown');
  
  // Clear all auth-related cookies
  document.cookie.split(";").forEach((c) => {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
    if (name.startsWith("next-auth") || name.startsWith("kc-")) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
    }
  });
  
  if (session?.provider === 'keycloak' && session?.idToken) {
    const keycloakIssuer = session.keycloakIssuer;
    if (keycloakIssuer) {
      const logoutUrl = `${keycloakIssuer}/protocol/openid-connect/logout`;
      const params = new URLSearchParams({
        id_token_hint: session.idToken,
        post_logout_redirect_uri: `${globalThis.location.origin}/api/auth/signout-callback`,
        client_id: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID!,
      });
      
      // Clear NextAuth session first (without redirect)
      await nextAuthSignOut({ redirect: false });
      
      // Small delay to ensure session is cleared
      setTimeout(() => {
        globalThis.location.href = `${logoutUrl}?${params.toString()}`;
      }, 100);
      
      return;
    }
  }
  
  // Fallback to regular NextAuth signOut
  await nextAuthSignOut({ callbackUrl: '/login?logout=success' });
}