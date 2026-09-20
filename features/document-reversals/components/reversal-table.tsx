'use client';

/**
 * One page of reversal requests, with the approver's decisions inline on
 * the pending ones. The queue is the same table filtered to PENDING.
 */
import Link from 'next/link';
import { format } from 'date-fns';
import { Check, Undo2, X } from 'lucide-react';
import {
  DocumentReversalStatus,
  documentReversalStatusBadgeColors,
  documentReversalStatusLabels,
  type DocumentReversal,
} from '@tornotron/echno-core/document-reversals/types';
import { Badge } from '@/components/shadcn/badge';
import { Button } from '@/components/shadcn/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/table';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/shadcn/empty';
import { routes } from '@/nav';
import { documentHref, documentLabel } from '../lib';
import type { ReversalDecision } from './decide-reversal-dialog';

interface ReversalTableProps {
  reversals: DocumentReversal[];
  canDecide: boolean;
  /** The caller's user id, so a requester's own pending row is marked. */
  currentUserId?: number;
  onDecide: (reversal: DocumentReversal, decision: ReversalDecision) => void;
  emptyTitle: string;
  emptyDescription: string;
}

export function ReversalTable({
  reversals,
  canDecide,
  currentUserId,
  onDecide,
  emptyTitle,
  emptyDescription,
}: ReversalTableProps) {
  if (reversals.length === 0) {
    return (
      <Empty variant="default">
        <EmptyMedia variant="icon">
          <Undo2 className="h-6 w-6" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Requested</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reversals.map((reversal) => {
          const pending = reversal.status === DocumentReversalStatus.pending;
          const own = !!currentUserId && currentUserId === reversal.requestedBy;
          // The requester cannot approve their own request unless they hold
          // system-admin; the server refuses it, so the buttons are hidden
          // rather than shown to fail.
          const mayDecide = canDecide && pending;
          return (
            <TableRow key={reversal.id}>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={documentHref(reversal)}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {documentLabel(reversal)}
                  </Link>
                  <Link
                    href={routes.resources.reversals.detail(reversal.id).href}
                    className="text-muted-foreground text-xs underline-offset-2 hover:underline"
                  >
                    Reversal #{reversal.id}
                  </Link>
                </div>
              </TableCell>
              <TableCell className="max-w-md">
                <p className="line-clamp-2 text-sm">{reversal.reason}</p>
                {reversal.decisionNote && !pending && (
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {reversal.decisionNote}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                <div className="flex flex-col">
                  <span>
                    {reversal.requestedByName ?? 'Creator'}
                    {own && (
                      <span className="text-muted-foreground"> (you)</span>
                    )}
                  </span>
                  {reversal.requestedAt && (
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(reversal.requestedAt), 'MMM dd, yyyy')}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  className={documentReversalStatusBadgeColors[reversal.status]}
                >
                  {documentReversalStatusLabels[reversal.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {mayDecide ? (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDecide(reversal, 'reject')}
                    >
                      <X className="mr-1 h-3.5 w-3.5" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onDecide(reversal, 'approve')}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Approve
                    </Button>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    {reversal.decidedByName
                      ? `${documentReversalStatusLabels[reversal.status]} by ${reversal.decidedByName}`
                      : ''}
                  </span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
