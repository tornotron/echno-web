'use client';

import { use } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Check, Loader2, Undo2, X } from 'lucide-react';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import { Card } from '@/components/shadcn/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import { PageHeader } from '@/components/common';
import { routes } from '@/nav';
import { useUser } from '@tornotron/echno-core/user/hooks';
import {
  DocumentReversalStatus,
  documentReversalStatusBadgeColors,
  documentReversalStatusLabels,
} from '@tornotron/echno-core/document-reversals/types';
import { useDocumentReversal } from '@tornotron/echno-core/document-reversals/hooks';
import { useAuthorization } from '@/hooks/use-authorization';
import { DecideReversalDialog } from '@/features/document-reversals/components';
import { useReversalDecision } from '@/features/document-reversals/hooks';
import { documentHref, documentLabel } from '@/features/document-reversals/lib';

export default function ReversalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = use(params);
  const id = Number(rawId);
  const { data: reversal, isLoading } = useDocumentReversal(id);
  const { data: currentUser } = useUser();
  const { isSystemAdmin, isManagerOrAbove } = useAuthorization();
  const decision = useReversalDecision();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!reversal) {
    return (
      <Empty variant="default">
        <EmptyMedia variant="icon">
          <Undo2 className="h-6 w-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Reversal request not found</EmptyTitle>
          <EmptyDescription>
            This record may not exist in your organization or the link is
            invalid.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline">
          <Link href={routes.resources.reversals.href}>Back to reversals</Link>
        </Button>
      </Empty>
    );
  }

  const pending = reversal.status === DocumentReversalStatus.pending;
  const canDecide = (isSystemAdmin || isManagerOrAbove) && pending;
  const isRequester =
    !!currentUser?.id && currentUser.id === reversal.requestedBy;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={`Reversal #${reversal.id}`}
        description={
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={documentReversalStatusBadgeColors[reversal.status]}
            >
              {documentReversalStatusLabels[reversal.status]}
            </Badge>
            <Link
              href={documentHref(reversal)}
              className="text-sm underline-offset-2 hover:underline"
            >
              {documentLabel(reversal)}
            </Link>
            {reversal.requestedAt && (
              <span className="text-muted-foreground text-sm">
                Requested{' '}
                {format(new Date(reversal.requestedAt), 'MMM dd, yyyy')}
              </span>
            )}
          </div>
        }
        actions={
          canDecide ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => decision.open(reversal, 'reject')}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => decision.open(reversal, 'approve')}
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                Approve
              </Button>
            </>
          ) : undefined
        }
      />

      {isRequester && pending && (
        <p className="text-muted-foreground text-sm">
          You raised this request. An administrator or project manager decides
          it; you can withdraw it from the document&apos;s page.
        </p>
      )}

      <Card className="space-y-4 p-6">
        <Field label="Requested by">
          {reversal.requestedByName ?? 'Creator'}
        </Field>
        <Field label="Reason">{reversal.reason}</Field>
        {!pending && (
          <>
            <Field
              label={`${documentReversalStatusLabels[reversal.status]} by`}
            >
              {reversal.decidedByName ?? ''}
              {reversal.decidedAt &&
                ` on ${format(new Date(reversal.decidedAt), 'MMM dd, yyyy HH:mm')}`}
            </Field>
            {reversal.decisionNote && (
              <Field label="Note">{reversal.decisionNote}</Field>
            )}
            {reversal.reversalReference && (
              <Field label="Ledger reference">
                <span className="font-mono text-sm">
                  {reversal.reversalReference}
                </span>
                <span className="text-muted-foreground ml-2 text-xs">
                  The correcting entries in the stock ledger carry this
                  reference.
                </span>
              </Field>
            )}
          </>
        )}
      </Card>

      <DecideReversalDialog
        reversal={decision.target}
        decision={decision.decision}
        onOpenChange={(open) => {
          if (!open) decision.close();
        }}
        onApprove={decision.onApprove}
        onReject={decision.onReject}
        isPending={decision.isPending}
      />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-sm">{children}</p>
    </div>
  );
}
