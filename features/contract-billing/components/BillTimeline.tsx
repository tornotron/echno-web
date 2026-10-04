'use client';

import { useState } from 'react';
import { getErrorMessage, getErrorTitle } from '@tornotron/echno-core';
import {
  useAddBillNote,
  useBillEvents,
} from '@tornotron/echno-core/contract-billing/hooks';
import type { Bill } from '@tornotron/echno-core/contract-billing/types';
import { Button } from '@/components/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Skeleton } from '@/components/shadcn/skeleton';
import { Textarea } from '@/components/shadcn/textarea';
import { toast } from '@/lib/styles/toast-styles';
import { formatDateTime } from '../lib/format';
import { EVENT_LABELS, STATUS_LABELS } from '../lib/labels';

/** Every step, measurement, document and note on the bill, newest first. */
export function BillTimeline({
  bill,
  canNote,
}: {
  bill: Bill;
  canNote: boolean;
}) {
  const { data = [], isPending, isError, error } = useBillEvents(bill.id);
  const addNote = useAddBillNote();
  const [note, setNote] = useState('');

  const submit = () => {
    if (!note.trim()) return;
    addNote.mutate(
      { id: bill.id, text: note.trim() },
      {
        onSuccess: () => {
          setNote('');
          toast.success('Note added');
        },
        onError: (err) =>
          toast.error(getErrorTitle(err, 'Could not add the note'), {
            description: getErrorMessage(err),
          }),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canNote && (
          <div className="space-y-2">
            <Textarea
              aria-label="Note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for the people working on this bill"
            />
            <Button
              size="sm"
              onClick={submit}
              disabled={addNote.isPending || !note.trim()}
            >
              Add note
            </Button>
          </div>
        )}
        {isPending && <Skeleton className="h-24 w-full" />}
        {isError && (
          <p role="alert" className="text-destructive text-sm">
            Could not load the timeline: {getErrorMessage(error)}
          </p>
        )}
        {!isPending && !isError && data.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Nothing has happened on this bill yet.
          </p>
        )}
        <ol className="space-y-3 border-l pl-4">
          {data.map((event) => (
            <li key={event.id} className="relative text-sm">
              <span className="bg-primary absolute top-1.5 -left-[21px] size-2 rounded-full" />
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-medium">{EVENT_LABELS[event.type]}</span>
                {event.toStatus && event.fromStatus && (
                  <span className="text-muted-foreground text-xs">
                    {STATUS_LABELS[event.fromStatus]} to{' '}
                    {STATUS_LABELS[event.toStatus]}
                  </span>
                )}
                <span className="text-muted-foreground ml-auto text-xs">
                  {formatDateTime(event.createdAt)}
                </span>
              </div>
              {event.note && (
                <p className="whitespace-pre-wrap">{event.note}</p>
              )}
              {event.actorName && (
                <p className="text-muted-foreground text-xs">
                  by {event.actorName}
                </p>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
