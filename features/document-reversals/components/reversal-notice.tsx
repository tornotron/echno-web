'use client';

/**
 * What a document page says about its reversal, above the content.
 *
 * Three states, read from the requests raised on the document:
 * - reversed: the approved request that undid it, linked;
 * - pending: who asked and why, with "Withdraw" for the requester and
 *   "Review" for an approver, both leading to the reversals page;
 * - nothing, when neither holds. A rejected or withdrawn request is history
 *   and is not shouted about here; the reversals page lists it.
 */
import Link from 'next/link';
import { format } from 'date-fns';
import { AlertTriangle, Undo2 } from 'lucide-react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  DocumentReversalStatus,
  type DocumentReversal,
  type ReversibleDocumentType,
} from '@tornotron/echno-core/document-reversals/types';
import {
  useCancelDocumentReversal,
  useDocumentReversalsByDocument,
} from '@tornotron/echno-core/document-reversals/hooks';
import { useUser } from '@tornotron/echno-core/user/hooks';
import { Button } from '@/components/shadcn/button';
import { toast } from '@/lib/styles/toast-styles';
import { useAuthorization } from '@/hooks/use-authorization';
import { routes } from '@/nav';

interface ReversalNoticeProps {
  documentType: ReversibleDocumentType;
  documentId: number;
}

export function ReversalNotice({
  documentType,
  documentId,
}: ReversalNoticeProps) {
  const { data: reversals } = useDocumentReversalsByDocument(
    documentType,
    documentId
  );

  const approved = reversals?.find(
    (r) => r.status === DocumentReversalStatus.approved
  );
  const pending = reversals?.find(
    (r) => r.status === DocumentReversalStatus.pending
  );

  if (approved) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
        <Undo2 className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p>
            This document was reversed
            {approved.decidedAt
              ? ` on ${format(new Date(approved.decidedAt), 'MMM dd, yyyy')}`
              : ''}
            {approved.decidedByName ? ` by ${approved.decidedByName}` : ''}. Its
            stock movements have been undone and it stays here as history.
          </p>
          <p className="text-red-700/80 dark:text-red-300/80">
            Reason given: {approved.reason}.{' '}
            <Link
              href={routes.resources.reversals.detail(approved.id).href}
              className="underline underline-offset-2"
            >
              View reversal #{approved.id}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (!pending) return null;
  return <PendingReversalBanner pending={pending} />;
}

/**
 * Split out so the session and role lookups run only when there is a pending
 * request to act on; a page with none asks the server one question, not three.
 */
function PendingReversalBanner({ pending }: { pending: DocumentReversal }) {
  const { data: currentUser } = useUser();
  const { isSystemAdmin, isManagerOrAbove } = useAuthorization();
  const cancel = useCancelDocumentReversal();
  const isRequester =
    !!currentUser?.id && currentUser.id === pending.requestedBy;
  const canDecide = isSystemAdmin || isManagerOrAbove;

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        <p>
          A reversal of this document is awaiting approval, requested by{' '}
          {pending.requestedByName ?? 'its creator'}
          {pending.requestedAt
            ? ` on ${format(new Date(pending.requestedAt), 'MMM dd, yyyy')}`
            : ''}
          .
        </p>
        <p className="text-amber-800/80 dark:text-amber-200/80">
          Reason: {pending.reason}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {canDecide && (
          <Button asChild size="sm" variant="outline">
            <Link href={routes.resources.reversals.detail(pending.id).href}>
              Review
            </Link>
          </Button>
        )}
        {isRequester && (
          <Button
            size="sm"
            variant="ghost"
            disabled={cancel.isPending}
            onClick={() =>
              cancel.mutate(pending.id, {
                onSuccess: () => toast.success('Reversal request withdrawn'),
                onError: (error) =>
                  toast.error(
                    getErrorTitle(error, 'Could not withdraw the request'),
                    {
                      description: getErrorMessage(error),
                    }
                  ),
              })
            }
          >
            Withdraw
          </Button>
        )}
      </div>
    </div>
  );
}
