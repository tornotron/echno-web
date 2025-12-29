import NextAuth from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import KeycloakProvider from 'next-auth/providers/keycloak';
import Credentials from 'next-auth/providers/credentials';
import { jwtDecode } from 'jwt-decode';
import { getRolePermissions } from '@/lib/rbac/permissions';
import { isSessionRevoked } from '@/lib/auth/session-revocation';

interface KeycloakToken {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
  roles?: string[];
  permissions?: unknown[];
  [key: string]: unknown;
}

interface DecodedKeycloakToken {
  sid?: string;
  session_state?: string;
  sub?: string;
  exp?: number;
  iat?: number;
  azp?: string;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
  [key: string]: unknown;
}

/**
 * Refresh Keycloak access token using refresh token
 */
async function refreshAccessToken(
  token: KeycloakToken
): Promise<KeycloakToken> {
  try {
    const issuer = process.env.KEYCLOAK_ISSUER!;

    const response = await fetch(`${issuer}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.KEYCLOAK_ID!,
        client_secret: process.env.KEYCLOAK_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken || '',
      }),
    });

    const refreshed = await response.json();

    if (!response.ok) {
      throw refreshed;
    }

    return {
      ...token,
      accessToken: refreshed.access_token,
      idToken: refreshed.id_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      expiresAt: Date.now() + refreshed.expires_in * 1000,
      lastRefresh: Date.now(),
    };
  } catch (error) {
    console.error('Token refresh failed:', error);
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',

  secret: process.env.NEXTAUTH_SECRET,

  session: { strategy: 'jwt' },

  // Production cookie configuration for nginx reverse proxy
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://'),
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NEXTAUTH_URL?.startsWith('https://'),
      },
    },
  },

  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID!,
      clientSecret: process.env.KEYCLOAK_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
      checks: ['state'],
      // Enable backchannel logout
      client: {
        token_endpoint_auth_method: 'client_secret_post',
      },
    }),

    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          console.error('NEXT_PUBLIC_API_URL is not configured');
          return null;
        }

        try {
          const res = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          if (!res.ok) {
            console.error(`Login failed: ${res.status} ${res.statusText}`);
            return null;
          }

          const data = await res.json();

          if (!data?.user || !data?.access_token) {
            console.error('Invalid response from auth API');
            return null;
          }

          return {
            id: String(data.user.id),
            email: data.user.email,
            name: data.user.name,
            roles: data.user.roles || [data.user.role].filter(Boolean),
            role: data.user.role,
            accessToken: data.access_token,
          };
        } catch (error) {
          console.error('Auth API error:', error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // DEBUG: Track JWT callback execution
      console.log('[Auth] JWT Callback Executed:', {
        hasAccount: !!account,
        hasUser: !!user,
        provider: account?.provider || token.provider,
        timestamp: new Date().toISOString(),
      });

      // ========== KEYCLOAK LOGIN ==========
      if (account?.provider === 'keycloak') {
        token.provider = 'keycloak';
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.expiresAt = Date.now() + (account.expires_in ?? 300) * 1000;
        token.lastRefresh = Date.now();
        token.keycloakIssuer = process.env.KEYCLOAK_ISSUER;
        token.error = undefined;

        // NEW: Extract roles and session ID from Keycloak token
        try {
          const decodedToken = jwtDecode<DecodedKeycloakToken>(
            account.access_token!
          );

          // DEBUG: Log the full decoded token to see what's available
          console.log('[Auth] Keycloak Token Content:', {
            sid: decodedToken?.sid,
            session_state: decodedToken?.session_state,
            sub: decodedToken?.sub,
            exp: decodedToken?.exp,
            iat: decodedToken?.iat,
            azp: decodedToken?.azp,
            hasRealmRoles: !!decodedToken?.realm_access?.roles,
            hasResourceRoles:
              !!decodedToken?.resource_access?.[process.env.KEYCLOAK_ID!]
                ?.roles,
          });

          const realmRoles = decodedToken?.realm_access?.roles || [];
          const resourceRoles =
            decodedToken?.resource_access?.[process.env.KEYCLOAK_ID!]?.roles ||
            [];

          // Combine realm and resource roles
          const keycloakRoles = [...realmRoles, ...resourceRoles];

          // Map Keycloak roles to your system roles (or use directly)
          token.roles = keycloakRoles;

          // Compute permissions from roles
          token.permissions = getRolePermissions(keycloakRoles);

          // Extract session ID for backchannel logout
          // Keycloak sends 'sid' in the access token
          token.sessionId =
            decodedToken?.sid || decodedToken?.session_state || token.sub;

          // Log extracted session ID
          console.log('[Auth] Extracted Session ID:', token.sessionId);
          console.log('[Auth] Token Expiry:', {
            expiresAt: new Date(
              Date.now() + (account.expires_in ?? 300) * 1000
            ),
            expiresInSeconds: account.expires_in,
          });
        } catch (error) {
          console.error('Failed to extract roles from Keycloak token:', error);
          token.roles = [];
          token.permissions = [];
        }
      }

      // ========== CREDENTIALS LOGIN ==========
      if (account?.provider === 'credentials' && user) {
        token.provider = 'credentials';
        token.accessToken = user.accessToken;
        token.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

        // Extract roles from credentials response
        token.roles = user.roles || [];

        // Compute permissions from roles
        token.permissions = getRolePermissions(user.roles || []);
      }

      // ========== USER INFO ==========
      if (user) {
        token.userId = user.id;
        token.email = user.email;
        token.name = user.name;
      }

      // Session revoked via backchannel logout
      if (token.sessionId) {
        const revoked = isSessionRevoked(token.sessionId as string);
        console.log(`[Auth] Session Revocation Check:`, {
          sessionId: token.sessionId,
          isRevoked: revoked,
          timestamp: new Date().toISOString(),
        });

        if (revoked) {
          console.log(
            `[Auth] Session revoked via backchannel logout: ${token.sessionId}`
          );
          return { ...token, error: 'SessionRevoked' };
        }
      } else {
        console.log('[Auth] No sessionId found in token for revocation check');
      }

      // STOP refresh if already failed (check BEFORE expiration)
      if (token.error === 'RefreshAccessTokenError') {
        return token;
      }

      // Token still valid
      if (token.expiresAt && Date.now() < token.expiresAt) {
        const timeUntilExpiry = token.expiresAt - Date.now();
        console.log('[Auth] Token still valid:', {
          expiresAt: new Date(token.expiresAt),
          timeUntilExpiry: `${Math.floor(timeUntilExpiry / 60_000)} minutes ${Math.floor((timeUntilExpiry % 60_000) / 1000)} seconds`,
        });
        return token;
      }

      // ========== REFRESH TOKEN ==========
      // Refresh only once
      console.log('[Auth] Token expired, attempting refresh...');
      if (token.provider === 'keycloak' && token.refreshToken) {
        const refreshed = await refreshAccessToken(token);

        // Re-extract roles after refresh
        if (refreshed.accessToken && !refreshed.error) {
          try {
            const decodedToken = jwtDecode<DecodedKeycloakToken>(
              refreshed.accessToken
            );
            const realmRoles = decodedToken?.realm_access?.roles || [];
            const resourceRoles =
              decodedToken?.resource_access?.[process.env.KEYCLOAK_ID!]
                ?.roles || [];
            refreshed.roles = [...realmRoles, ...resourceRoles];
            refreshed.permissions = getRolePermissions(refreshed.roles);
          } catch (error) {
            console.error('Failed to extract roles after refresh:', error);
          }
        }

        return refreshed as JWT;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.email = token.email ?? '';
      session.user.name = token.name ?? '';

      // Roles (permissions and super admin status computed on-demand from roles)
      session.user.roles = token.roles || [];

      // Minimal session data to reduce cookie size
      session.provider = token.provider;
      session.expiresAt = token.expiresAt;
      session.sessionId = token.sessionId;

      if (token.error) {
        session.error = token.error;
      }

      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  events: {
    async signOut(message) {
      // Keycloak backchannel logout
      if ('token' in message && message.token) {
        const token = message.token;
        if (token.provider === 'keycloak' && token.idToken) {
          try {
            const issuer = token.keycloakIssuer || process.env.KEYCLOAK_ISSUER;
            const logoutUrl = `${issuer}/protocol/openid-connect/logout`;

            await fetch(logoutUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: process.env.KEYCLOAK_ID!,
                client_secret: process.env.KEYCLOAK_SECRET!,
                refresh_token: token.refreshToken as string,
              }),
            });
          } catch (error) {
            console.error('Keycloak logout error:', error);
            // Don't throw - allow NextAuth logout to proceed
          }
        }
      }
    },
  },
});
