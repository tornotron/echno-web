'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import {
  Empty,
  EmptyErrorMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from '@/components/shadcn/empty';

export function InvitationFetchError() {
  return (
    <Empty variant="error">
      <EmptyErrorMedia>
        <AlertCircle className="size-6" />
      </EmptyErrorMedia>
      <EmptyHeader>
        <EmptyTitle>Failed to load invitations</EmptyTitle>
        <EmptyDescription>
          There was a problem fetching invitations. Please try again.
        </EmptyDescription>
      </EmptyHeader>
      <Button variant="outline" onClick={() => globalThis.location.reload()}>
        Retry
      </Button>
    </Empty>
  );
}
