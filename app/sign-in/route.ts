/** Starts a WorkOS sign-in, and is the Initiate login URI set in WorkOS. Answers 404 under Keycloak. */
export { workosSignInRoute as GET } from '@/lib/auth/server';
