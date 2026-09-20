'use client';

/**
 * The "Request reversal" control for a document page. Shown only to the
 * document's creator, and only while the server says the document can be
 * reversed; the answer comes from `GET /document-reversals/web/eligibility`
 * so the page applies the same rules the request would be refused by.
 *
 * A creator whose document is blocked sees the control disabled with the
 * blocker as its title, so the reason is one hover away rather than a 400.
 */
import { useCallback, useState } from 'react';
import { Undo2 } from 'lucide-react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import type { ReversibleDocumentType } from '@tornotron/echno-core/document-reversals/types';
import {
  useDocumentReversalEligibility,
  useRequestDocumentReversal,
} from '@tornotron/echno-core/document-reversals/hooks';
import { Button } from '@/components/shadcn/button';
import { toast } from '@/lib/styles/toast-styles';
import { RequestReversalDialog } from './request-reversal-dialog';

interface ReversalControlsProps {
  documentType: ReversibleDocumentType;
  documentId: number;
  /** What the document is called on screen, e.g. "site transfer ST-0031". */
  documentLabel: string;
  /** True when approval will move stock back; the dialog copy says so. */
  movesStock?: boolean;
}

export function ReversalControls({
  documentType,
  documentId,
  documentLabel,
  movesStock = true,
}: ReversalControlsProps) {
  const { data: eligibility } = useDocumentReversalEligibility(
    documentType,
    documentId
  );
  const { mutate, isPending } = useRequestDocumentReversal();
  const [isOpen, setIsOpen] = useState(false);

  const request = useCallback(
    (reason: string) => {
      mutate(
        { documentType, documentId, reason },
        {
          onSuccess: () => {
            setIsOpen(false);
            toast.success('Reversal requested', {
              description:
                'An administrator or project manager will approve or reject it. Nothing changes until then.',
            });
          },
          onError: (error) => {
            toast.error(
              getErrorTitle(error, 'Could not request the reversal'),
              {
                description: getErrorMessage(error),
              }
            );
          },
        }
      );
    },
    [mutate, documentType, documentId]
  );

  // Not the creator, or already reversed, or a request is pending: the
  // notice above the page says so and the control has nothing to offer.
  if (!eligibility?.callerIsCreator) return null;
  if (eligibility.reversalId || eligibility.pendingReversalId) return null;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={!eligibility.reversible || isPending}
        title={eligibility.reversible ? undefined : eligibility.blocker}
        onClick={() => setIsOpen(true)}
      >
        <Undo2 className="mr-1.5 h-4 w-4" />
        Request reversal
      </Button>
      <RequestReversalDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        documentLabel={documentLabel}
        movesStock={movesStock}
        onRequest={request}
        isPending={isPending}
      />
    </>
  );
}
