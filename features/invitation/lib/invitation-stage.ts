/**
 * How each invitation stage reads on the screens, and what it offers.
 *
 * Resend and revoke apply to a pending invitation and to an expired one
 * (`isMemberInvitationOpen` in core). Resending a pending invitation sends the
 * same link and keeps its expiry; resending an expired one renews it with a
 * new link and a new expiry. An accepted, revoked or unknown invitation offers
 * neither.
 */

import type {
  MemberInvitation,
  MemberInvitationStage,
} from '@tornotron/echno-core/member-invitations/types';

/** Stages in the order the screens list them. */
export const INVITATION_STAGES: readonly MemberInvitationStage[] = [
  'PENDING',
  'ACCEPTED',
  'ACCEPTED_BY_ANOTHER_ADDRESS',
  'EXPIRED',
  'REVOKED',
  'UNKNOWN',
];

export const STAGE_LABEL: Record<MemberInvitationStage, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  ACCEPTED_BY_ANOTHER_ADDRESS: 'Accepted by another address',
  EXPIRED: 'Expired',
  REVOKED: 'Revoked',
  UNKNOWN: 'Unknown',
};

/** One sentence on what the stage means for the administrator. */
export const STAGE_EXPLANATION: Record<MemberInvitationStage, string> = {
  PENDING: 'Waiting for the person to accept.',
  ACCEPTED: 'Accepted by the invited address. The person is now an employee.',
  ACCEPTED_BY_ANOTHER_ADDRESS:
    'Someone accepted with a different address, so nobody was added. Invite the person again at the address they use.',
  EXPIRED:
    'The link stopped working. Resending sends a new link with a new expiry.',
  REVOKED: 'An administrator stopped the link.',
  UNKNOWN: 'This screen does not know this stage yet, so it offers no action.',
};

/** What the resend button says for an open invitation. */
export function resendLabel(stage: MemberInvitationStage): string {
  return stage === 'EXPIRED' ? 'Renew and resend' : 'Resend';
}

/** What resending will do to the expiry, shown beside the button. */
export function resendExpiryNote(
  invitation: Pick<MemberInvitation, 'status' | 'expiresAt'>,
  formatDate: (date: Date) => string
): string {
  if (invitation.status === 'EXPIRED') {
    return invitation.expiresAt
      ? `Expired ${formatDate(invitation.expiresAt)}. A resend sets a new expiry.`
      : 'Expired. A resend sets a new expiry.';
  }
  return invitation.expiresAt
    ? `Expires ${formatDate(invitation.expiresAt)}. A resend keeps this expiry.`
    : 'A resend keeps the current expiry.';
}

/** How many invitations sit at each stage. */
export function countByStage(
  invitations: Pick<MemberInvitation, 'status'>[]
): Record<MemberInvitationStage, number> {
  const counts = Object.fromEntries(
    INVITATION_STAGES.map((stage) => [stage, 0])
  ) as Record<MemberInvitationStage, number>;
  for (const invitation of invitations) counts[invitation.status]++;
  return counts;
}
