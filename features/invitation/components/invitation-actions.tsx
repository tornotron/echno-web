'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Ban, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/shadcn/dialog';
import { toast } from '@/lib/styles/toast-styles';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  useResendMemberInvitation,
  useRevokeMemberInvitation,
} from '@tornotron/echno-core/member-invitations/hooks';
import {
  isMemberInvitationOpen,
  type MemberInvitation,
} from '@tornotron/echno-core/member-invitations/types';
import { cn } from '@/lib/utils';
import { resendExpiryNote, resendLabel } from '../lib/invitation-stage';

interface InvitationActionsProps {
  invitation: MemberInvitation;
  /** `row` keeps the buttons small for a table cell. */
  layout?: 'row' | 'panel';
}

const formatExpiry = (date: Date) => format(date, "MMM dd, yyyy 'at' h:mm a");

/**
 * Resend and revoke for one invitation, with the expiry shown beside resend,
 * since resending keeps it and renewing an expired one replaces it. Renders
 * nothing for an invitation that is no longer open.
 */
export function InvitationActions({
  invitation,
  layout = 'row',
}: InvitationActionsProps) {
  const resend = useResendMemberInvitation();
  const revoke = useRevokeMemberInvitation();
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  if (!isMemberInvitationOpen(invitation)) return null;

  const busy = resend.isPending || revoke.isPending;
  const renewing = invitation.status === 'EXPIRED';

  const onResend = () =>
    resend.mutate(invitation.id, {
      onSuccess: (updated) => {
        toast.success(renewing ? 'Invitation renewed' : 'Invitation resent', {
          description: updated.expiresAt
            ? `The link to ${updated.email} now expires ${formatExpiry(updated.expiresAt)}.`
            : `A link is on its way to ${updated.email}.`,
        });
      },
      onError: (error) =>
        toast.error(getErrorTitle(error, 'Could not resend the invitation'), {
          description: getErrorMessage(error),
        }),
    });

  const onRevoke = () =>
    revoke.mutate(invitation.id, {
      onSuccess: (updated) => {
        setConfirmRevoke(false);
        toast.success('Invitation revoked', {
          description: `The link to ${updated.email} no longer works.`,
        });
      },
      onError: (error) => {
        setConfirmRevoke(false);
        toast.error(getErrorTitle(error, 'Could not revoke the invitation'), {
          description: getErrorMessage(error),
        });
      },
    });

  const size = layout === 'row' ? 'sm' : 'default';

  return (
    <div
      className={cn(
        'flex gap-2',
        layout === 'row' ? 'flex-col items-start' : 'flex-col'
      )}
    >
      <div
        className={cn(
          'flex gap-2',
          layout === 'row' ? 'items-center' : 'flex-col'
        )}
      >
        <Button
          type="button"
          variant="outline"
          size={size}
          disabled={busy}
          onClick={onResend}
          data-testid="invitation-resend"
        >
          {resend.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {resendLabel(invitation.status)}
        </Button>
        <Button
          type="button"
          variant="outline"
          size={size}
          disabled={busy}
          onClick={() => setConfirmRevoke(true)}
          className="text-destructive"
          data-testid="invitation-revoke"
        >
          <Ban className="mr-2 h-4 w-4" />
          Revoke
        </Button>
      </div>
      <p
        className="text-muted-foreground text-xs"
        data-testid="invitation-resend-expiry"
      >
        {resendExpiryNote(invitation, formatExpiry)}
      </p>

      <Dialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke this invitation?</DialogTitle>
            <DialogDescription>
              The link sent to{' '}
              <span className="font-medium">{invitation.email}</span> stops
              working. To invite them later, send a new invitation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRevoke(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={revoke.isPending}
              onClick={onRevoke}
              data-testid="invitation-revoke-confirm"
            >
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
