import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';
import Credentials from 'next-auth/providers/credentials';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const { handlers, signIn, signOut, auth } = (NextAuth as any)({
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_PUBLIC_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Check for test user credentials from environment
        const testEmail = process.env.TEST_USER_EMAIL;
        const testPassword = process.env.TEST_USER_PASSWORD;

        if (
          testEmail &&
          testPassword &&
          credentials.email === testEmail &&
          credentials.password === testPassword
        ) {
          // Return test user for local development
          return {
            id: 'test-user-id',
            email: testEmail,
            name: 'Admin User',
            accessToken: 'test-access-token',
          };
        }

        try {
          // Call your backend API to validate credentials
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
          const response = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            console.error('Login failed:', response.statusText);
            return null;
          }

          const data = await response.json();

          // Return user object if authentication successful
          if (data.access_token && data.user) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name || data.user.email,
              accessToken: data.access_token,
            };
          }

          return null;
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user, account }: any) {
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.provider = account.provider;
        token.refreshToken = account.refresh_token;
      }

      // Add user accessToken for credentials provider
      if (user && 'accessToken' in user) {
        token.accessToken = user.accessToken as string;
      }

      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      // Add tokens to session for client-side access
      if (token) {
        session.accessToken = token.accessToken as string;
        session.idToken = token.idToken as string;
        session.provider = token.provider as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
});
