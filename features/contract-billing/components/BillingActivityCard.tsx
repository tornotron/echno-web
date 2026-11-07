'use client';

import Link from 'next/link';
import { getErrorMessage } from '@tornotron/echno-core';
import { useBillingActivity } from '@tornotron/echno-core/contract-billing/hooks';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Skeleton } from '@/components/shadcn/skeleton';
import { routes } from '@/nav';
import { formatDateTime } from '../lib/format';
import { EVENT_LABELS } from '../lib/labels';

const LIMIT = 8;

/** The latest bill events, across the organization or for one project. */
export function BillingActivityCard({ projectId }: { projectId?: number }) {
  const { data, isPending, isError, error } = useBillingActivity({
    projectId,
    limit: LIMIT,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending && <Skeleton className="h-40 w-full" />}
        {isError && (
          <p role="alert" className="text-destructive text-sm">
            Could not load the activity: {getErrorMessage(error)}
          </p>
        )}
        {data?.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Nothing has happened on a bill yet.
          </p>
        )}
        {data && data.length > 0 && (
          <ul className="space-y-3">
            {data.map((event) => (
              <li key={event.id} className="text-sm">
                <Link
                  className="font-medium hover:underline"
                  href={
                    routes.inspections.billing.bills.detail(event.billId).href
                  }
                >
                  {EVENT_LABELS[event.type]}: {event.billNumber}
                </Link>
                {projectId === undefined && event.projectName && (
                  <p className="text-muted-foreground">{event.projectName}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  {[event.actorName, formatDateTime(event.createdAt)]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
