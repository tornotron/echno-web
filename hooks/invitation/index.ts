/**
 * hooks/invitation/index.ts
 *
 * Public module entry for invitation-related React hooks.
 *
 * This module re-exports stable, feature-focused hooks that encapsulate
 * data fetching and mutation logic for organization invitations. It serves
 * as the canonical import surface for invitation functionality across the
 * application — providing consistent behavior, documentation, and typings.
 *
 * Design notes:
 * - Exports are kept minimal and stable to avoid consumer churn.
 * - Hooks use React Query for caching, retry/backoff and error handling.
 *
 * See individual hook implementations for more details and examples.
 */

// Export all invitation hooks
export {
  useInvitationsByOrganization,
  useValidateInviteCode,
} from './use-invitation';

export {
  useGenerateInviteCode,
  useValidateInviteCodeMutation,
  useResendInvitation,
} from './use-invitation-mutations';
