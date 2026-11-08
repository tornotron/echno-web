/**
 * The browser's view of a WorkOS session: read, record activity, end in place. Answers 404 under
 * Keycloak, where Auth.js serves `/api/auth/session` instead.
 */
export {
  workosSessionRoute as DELETE,
  workosSessionRoute as GET,
  workosSessionRoute as POST,
} from '@/lib/auth/server';
