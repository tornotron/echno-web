/** WorkOS sends the browser here after sign-in. Answers 404 under Keycloak. */
export { workosCallbackRoute as GET } from '@/lib/auth/server';
